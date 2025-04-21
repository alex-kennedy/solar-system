import * as THREE from "three";

import { Planet, OrbitalElementsDelta } from "@/lib/planets";

import data from "@/assets/planets/data.json";

/** Scale factor for planet and sun points. */
const SCALE_FACTOR = 250;

/** Shows the sun, the planets, and pluto in a scene. */
class SolarSystem {
  /** The sun, located at 0,0,0. */
  sun: THREE.Mesh;

  /** The solar system's planets and pluto. */
  planets: Planet[];

  constructor() {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#F9D670"),
    });
    this.sun = new THREE.Mesh(geometry, material);

    this.planets = [];
    for (let planetData of data) {
      const planet = new Planet(
        planetData.planetName,
        planetData.orbitalElements as OrbitalElementsDelta,
        new THREE.Color(planetData.colour)
      );
      this.planets.push(planet);
    }
  }

  /** Shows the sun, the planets, and pluto in a scene. */
  showInScene(scene: THREE.Scene) {
    scene.add(this.sun);
    for (const planet of this.planets) {
      planet.showInScene(scene);
    }
  }

  /**
   * Scales size of the planet spheres and the sun to fixed sizes,
   * irrespective of how far from the camera they are.
   */
  scale(camera: THREE.Camera) {
    for (const planet of this.planets) {
      if (planet.sphere === null) {
        continue;
      }
      const scale =
        new THREE.Vector3()
          .subVectors(planet.currentPosition, camera.position)
          .length() / SCALE_FACTOR;
      planet.sphere.scale.set(scale, scale, scale);
    }

    const scale =
      new THREE.Vector3()
        .subVectors(this.sun.position, camera.position)
        .length() / SCALE_FACTOR;
    this.sun.scale.set(scale, scale, scale);
  }

  /** Set position time for planets, in Unix milliseconds. */
  setTime = (timeMs: number) => {
    this.planets.forEach((planet) => {
      planet.setTime(timeMs);
    });
  };
}

export { SolarSystem };
