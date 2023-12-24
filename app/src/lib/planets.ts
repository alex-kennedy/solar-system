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

export interface OrbitalElementsDelta {
  a: [number, number]; // semi-major axis
  e: [number, number]; // eccentricity
  i: [number, number]; // inclination
  l: [number, number]; // mean longitude
  longPeri: [number, number]; // longitude of perihelion
  longNode: [number, number]; // longitude of the ascending node
}

class OrbitCurve extends THREE.Curve<THREE.Vector3> {
  readonly type = "OrbitCurve";
  orbitalElements: OrbitalElements;
  argPeri: number;

  constructor(orbitalElements: OrbitalElements) {
    super();

    this.type = "OrbitCurve";
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

/**
 * Represents a planet, where its orbit and position can be shown in a scene.
 * Orbit focus is assumed to be 0,0,0 (heliocentric in this simulation).
 */
export class Planet {
  /** Name of the planet. */
  name: string;

  /**
   * Mesh object for the planet in its orbit. Only set if showInScene has been
   * called.
   */
  sphere: THREE.Mesh | null = null;

  /** Current position of the planet. */
  currentPosition: THREE.Vector3 = new THREE.Vector3();

  /** Orbital elements for the planet. */
  private readonly orbitalElements: OrbitalElements;

  /** Argument of perihelion, in degrees. */
  private readonly argPeri: number;

  /** Mean anomaly, in degrees. */
  private meanAnomaly: number;

  /** Eccentric anomaly, in degrees. */
  private eccentricAnomaly: number = 0.0;

  /** Orbit curve oject for the planets elliptical orbit. */
  private readonly curve: OrbitCurve;

  /** Color of the planet and orbit curves in the scene. */
  private readonly color: THREE.Color;

  constructor(
    name: string,
    orbitalElements: OrbitalElementsDelta,
    color: THREE.Color
    // focus?: THREE.Vector3 | undefined
  ) {
    this.name = name || "";
    this.color = color;
    // this.focus = focus || new THREE.Vector3(0, 0, 0);

    const timeCenturies = this.getCenturiesTT();

    // Part 1: compute planet's six elements
    this.orbitalElements = {
      a: orbitalElements.a[0] + timeCenturies * orbitalElements.a[1],
      e: orbitalElements.e[0] + timeCenturies * orbitalElements.e[1],
      i: orbitalElements.i[0] + timeCenturies * orbitalElements.i[1],
      l: orbitalElements.l[0] + timeCenturies * orbitalElements.l[1],
      longPeri:
        orbitalElements.longPeri[0] +
        timeCenturies * orbitalElements.longPeri[1],
      longNode:
        orbitalElements.longNode[0] +
        timeCenturies * orbitalElements.longNode[1],
    };

    // Part 2: compute argument of perihelion
    this.argPeri =
      this.orbitalElements.longPeri - this.orbitalElements.longNode;

    // Part 3: modulus the mean anomaly so -180 <= M <= 180
    this.meanAnomaly =
      ((this.orbitalElements.l - this.orbitalElements.longPeri + 180) % 360) -
      180;

    this.curve = this.initialiseOrbit();
  }

  /** Solves Kepler's equation with the given tolerance. */
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

  /** Get the number of centuries that have elapsed since J2000.0, TT. */
  getCenturiesTT(): number {
    const nowTT = this.getNowTT();
    return (nowTT / 86400.0 - 10957.5) / 36525;
  }

  /** Gets the current terrestrial time in unix seconds. */
  getNowTT() {
    return Date.now() / 1000 + 69.184;
  }

  /** Initialises the planets orbit curve and current location. */
  private initialiseOrbit(): OrbitCurve {
    const curve = new OrbitCurve(this.orbitalElements);
    const eccentricAnomaly = this.solveKepler(1e-6);
    curve.getPoint(eccentricAnomaly / 360, this.currentPosition);
    return curve;
  }

  /** Shows the planet and orbit in the given scene. */
  showInScene(scene: THREE.Scene) {
    this.showPlanetInScene(scene);
    this.showCurveInScene(scene);
  }

  /** Shows the planet's sphere in the given scene. */
  private showPlanetInScene(scene: THREE.Scene) {
    let geometry = new THREE.SphereGeometry(1, 16, 16);
    let material = new THREE.MeshBasicMaterial({
      color: this.color,
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.sphere.position.copy(this.currentPosition);
    scene.add(this.sphere);
  }

  /** Shows the elliptical orbit curve in the given scene. */
  private showCurveInScene(scene: THREE.Scene) {
    const points = this.curve.getPoints(200);

    const geometry = new MeshLineGeometry();
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
