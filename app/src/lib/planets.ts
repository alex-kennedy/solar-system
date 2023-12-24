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
  private orbitalElements: OrbitalElements;

  /** Orbital elements with their per century rates of change. */
  private readonly orbitalElementsDelta: OrbitalElementsDelta;

  /** Orbit curve oject for the planets elliptical orbit. */
  private readonly curve: OrbitCurve;

  /** Color of the planet and orbit curves in the scene. */
  private readonly color: THREE.Color;

  constructor(
    name: string,
    orbitalElementsDelta: OrbitalElementsDelta,
    color: THREE.Color
  ) {
    this.name = name || "";
    this.color = color;
    this.orbitalElementsDelta = orbitalElementsDelta;

    const time = Date.now() / 1000;
    this.orbitalElements = this.getOrbitalElements(time);
    this.curve = new OrbitCurve(this.orbitalElements);
    this.setTime(time);
  }

  /** Solves Kepler's equation with the given tolerance. */
  solveKepler(meanAnomaly: number, tol: number) {
    const e_star = (180 / Math.PI) * this.orbitalElements!.e;
    let E_n = meanAnomaly + e_star * Math.sin((Math.PI / 180) * meanAnomaly);
    let delta = 360;
    let count = 0;

    while (Math.abs(delta) > tol) {
      delta =
        (meanAnomaly - (E_n - e_star * Math.sin((Math.PI / 180) * E_n))) /
        (1 - this.orbitalElements!.e * Math.cos((Math.PI / 180) * E_n));
      E_n = E_n + delta;
      count = count + 1;
    }

    return E_n;
  }

  /** Sets the orbit position based on the given time, in Unix seconds. */
  setTime(time: number) {
    // Part 1: compute planet's updated six orbital elements
    this.orbitalElements = this.getOrbitalElements(time);

    // Part 2: modulus the mean anomaly so -180 <= M <= 180
    const meanAnomaly =
      ((this.orbitalElements.l - this.orbitalElements.longPeri + 180) % 360) -
      180;

    // Part 3: solve Kepler's equation to get the eccentric anomaly
    const eccentricAnomaly = this.solveKepler(meanAnomaly, 1e-6);
    this.curve.orbitalElements = this.orbitalElements;
    this.curve.getPoint(eccentricAnomaly / 360, this.currentPosition);
    this.sphere?.position.copy(this.currentPosition);
  }

  getOrbitalElements(time: number): OrbitalElements {
    const centuriesTT = this.getCenturiesTT(time);
    const ed = this.orbitalElementsDelta;
    return {
      a: ed.a[0] + centuriesTT * ed.a[1],
      e: ed.e[0] + centuriesTT * ed.e[1],
      i: ed.i[0] + centuriesTT * ed.i[1],
      l: ed.l[0] + centuriesTT * ed.l[1],
      longPeri: ed.longPeri[0] + centuriesTT * ed.longPeri[1],
      longNode: ed.longNode[0] + centuriesTT * ed.longNode[1],
    };
  }

  /**
   * Get the number of centuries that have elapsed between J2000.0, TT and the
   * given time.
   */
  getCenturiesTT(time: number): number {
    const timeTT = time + 69.184; // Terrestrial time in unix seconds
    return (timeTT / 86400.0 - 10957.5) / 36525;
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
