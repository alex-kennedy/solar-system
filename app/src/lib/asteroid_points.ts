import * as THREE from "three";

import orbitVertexShader from "../shaders/orbit/orbit.vert";
import orbitFragmentShader from "../shaders/orbit/orbit.frag";

// Mass of the sun in kilograms
const MASS_SUN = 1.98847e30;

// Universal gravitational constant in SI units
const GRAVITATIONAL_CONSTANT = 6.6743015e-11;

// Astronomical unit in metres
const ASTRONOMICAL_UNIT = 1.495978707e11;

/** Calculates mean motion (n) for a given semi-major axis length in AU. */
function calculateMeanMotion(a: number): number {
  return Math.sqrt(
    (GRAVITATIONAL_CONSTANT * MASS_SUN) / Math.pow(a * ASTRONOMICAL_UNIT, 3)
  );
}

interface Asteroid {
  e: number;
  a: number;
  i: number;
  longAsc: number;
  argPeri: number;
  meanAnomaly: number;
}

interface AsteroidStyle {
  pointSize?: number;
  alpha?: number;
  color?: THREE.Color;
}

export class AsteroidPoints extends THREE.Points {
  epoch: number;

  private shaderMaterial: THREE.ShaderMaterial;

  constructor(asteroids: Asteroid[], epoch: number, style: AsteroidStyle) {
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        size: { value: style.pointSize || 1.0 },
        alpha: { value: style.alpha || 1.0 },
        color: { value: style.color || new THREE.Color(0xffffff) },
        time: { value: 0.0 },
      },
      vertexShader: orbitVertexShader,
      fragmentShader: orbitFragmentShader,
      transparent: true,
      depthTest: true,
    });

    const a = new Float32Array(asteroids.length);
    const meanMotion = new Float32Array(asteroids.length);
    const meanAnomaly0 = new Float32Array(asteroids.length);
    const eccentricity = new Float32Array(asteroids.length);
    const orbitalPlane = new Float32Array(asteroids.length * 3);

    for (let i = 0; i < asteroids.length; i++) {
      a[i] = asteroids[i].a;
      meanMotion[i] = calculateMeanMotion(asteroids[i].a);
      meanAnomaly0[i] = asteroids[i].meanAnomaly;
      eccentricity[i] = asteroids[i].e;
      orbitalPlane[i * 3] = asteroids[i].longAsc;
      orbitalPlane[i * 3 + 1] = asteroids[i].argPeri;
      orbitalPlane[i * 3 + 2] = asteroids[i].i;
    }

    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute("a", new THREE.BufferAttribute(a, 1));
    geometry.setAttribute(
      "mean_motion",
      new THREE.BufferAttribute(meanMotion, 1)
    );
    geometry.setAttribute(
      "mean_anomaly_0",
      new THREE.BufferAttribute(meanAnomaly0, 1)
    );
    geometry.setAttribute(
      "eccentricity",
      new THREE.BufferAttribute(eccentricity, 1)
    );
    geometry.setAttribute(
      "orbital_plane",
      new THREE.BufferAttribute(orbitalPlane, 3)
    );
    // Unused but required.
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(asteroids.length * 3), 3)
    );

    super(geometry, shaderMaterial);
    this.shaderMaterial = shaderMaterial;
    this.epoch = epoch;
  }

  setTime(time: number) {
    this.shaderMaterial.uniforms.time.value = time - this.epoch;
  }
}
