import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial, raycast } from "meshline";

interface OrbitalElements {
  a: number; // semi-major axis
  e: number; // eccentricity
  i: number; // inclination
  l: number; // mean longitude
  longPeri: number; // longitude of perihelion
  longNode: number; // longitude of the ascending node
}

interface OrbitalElementsDelta {
  a: [number, number]; // semi-major axis
  e: [number, number]; // eccentricity
  i: [number, number]; // inclination
  l: [number, number]; // mean longitude
  longPeri: [number, number]; // longitude of perihelion
  longNode: [number, number]; // longitude of the ascending node
}

class OrbitCurve extends THREE.Curve<THREE.Vector3> {
  readonly type = "OrbitCurve";
  focus: THREE.Vector3;
  orbitalElements: OrbitalElements;
  argPeri: number;

  constructor(focus: THREE.Vector3, orbitalElements: OrbitalElements) {
    super();

    this.type = "OrbitCurve";
    this.focus = focus;
    this.orbitalElements = orbitalElements;
    this.argPeri = orbitalElements.longPeri - orbitalElements.longNode;
  }

  getPoint(
    t: number,
    optionalTarget: THREE.Vector3 | undefined
  ): THREE.Vector3 {
    const point = optionalTarget || new THREE.Vector3();

    const E = t * 360;
    const conversion = Math.PI / 180;

    const x =
      this.orbitalElements.a *
      (Math.cos(conversion * E) - this.orbitalElements.e);
    const y =
      this.orbitalElements.a *
      Math.sqrt(1 - Math.pow(this.orbitalElements.e, 2)) *
      Math.sin(conversion * E);

    const co = Math.cos(conversion * this.argPeri);
    const cO = Math.cos(conversion * this.orbitalElements.longNode);
    const cI = Math.cos(conversion * this.orbitalElements.i);
    const so = Math.sin(conversion * this.argPeri);
    const sO = Math.sin(conversion * this.orbitalElements.longNode);
    const sI = Math.sin(conversion * this.orbitalElements.i);

    const x_ecl = (co * cO - so * sO * cI) * x + (-so * cO - co * sO * cI) * y;
    const y_ecl = (co * sO + so * cO * cI) * x + (-so * sO + co * cO * cI) * y;
    const z_ecl = so * sI * x + co * sI * y;

    return point.set(x_ecl, y_ecl, z_ecl);
  }
}

class Planet {
  name: string;
  focus: THREE.Vector3;

  orbitalElements: OrbitalElements;
  argPeri: number;
  meanAnomaly: number;
  eccentricAnomaly: number = 0.0;
  currentPosition: THREE.Vector3 | null = null;
  curve: OrbitCurve | null = null;

  color: THREE.Color;
  timeCenturies: number;

  constructor(
    name: string,
    orbitalElements: OrbitalElementsDelta,
    color: THREE.Color,
    focus: THREE.Vector3 | undefined
  ) {
    this.name = name || "";
    this.focus = focus || new THREE.Vector3(0, 0, 0);

    this.color = color;
    this.timeCenturies = this.getCenturiesTT();

    // Part 1: compute planet's six elements
    this.orbitalElements = {
      a: orbitalElements.a[0] + this.timeCenturies * orbitalElements.a[1],
      e: orbitalElements.e[0] + this.timeCenturies * orbitalElements.e[1],
      i: orbitalElements.i[0] + this.timeCenturies * orbitalElements.i[1],
      l: orbitalElements.l[0] + this.timeCenturies * orbitalElements.l[1],
      longPeri:
        orbitalElements.longPeri[0] +
        this.timeCenturies * orbitalElements.longPeri[1],
      longNode:
        orbitalElements.longNode[0] +
        this.timeCenturies * orbitalElements.longNode[1],
    };

    // Part 2: compute argument of perihelion
    this.argPeri =
      this.orbitalElements.longPeri - this.orbitalElements.longNode;

    // Part 3: modulus the mean anomaly so -180 <= M <= 180
    this.meanAnomaly =
      ((this.orbitalElements.l - this.orbitalElements.longPeri + 180) % 360) -
      180;
  }

  solveKepler(tol: number) {
    const e_star = (180 / Math.PI) * this.orbitalElements.e;
    let E_n =
      this.meanAnomaly + e_star * Math.sin((Math.PI / 180) * this.meanAnomaly);
    let delta = 360;
    let count = 0;

    while (Math.abs(delta) > tol) {
      delta =
        (this.meanAnomaly - (E_n - e_star * Math.sin((Math.PI / 180) * E_n))) /
        (1 - this.orbitalElements.e * Math.cos((Math.PI / 180) * E_n));
      E_n = E_n + delta;
      count = count + 1;
    }

    return E_n;
  }

  getCenturiesTT(): number {
    // Get the number of centuries that have elapsed since J2000.0, TT
    const nowTT = this.getNowTT();
    return (nowTT / 86400.0 - 10957.5) / 36525;
  }

  getNowTT() {
    // Get the current time as a unix seconds, but in Terrestrial Time
    return Date.now() / 1000 + 69.184;
  }

  initialiseOrbit() {
    this.curve = new OrbitCurve(this.focus, this.orbitalElements);
    const eccentricAnomaly = this.solveKepler(1e-6);
    this.currentPosition = this.curve.getPoint(
      eccentricAnomaly / 360,
      undefined
    );
  }

  showInScene(scene: THREE.Scene, camera: THREE.Camera) {
    const points = this.curve!.getPoints(200);

    const geometry = new MeshLineGeometry()
    geometry.setPoints(points);

    const material = new MeshLineMaterial({
      color: this.color,
      opacity: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      sizeAttenuation: 0,
      lineWidth: 10,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.raycast = raycast;
    scene.add(mesh);
  }
}

export { Planet };
