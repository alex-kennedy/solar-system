import * as THREE from "three";

import { Asteroids as AsteroidsProto, OrbitType } from "./proto/asteroids";

import orbitVertexShader from "../shaders/orbit/orbit.vert";
import orbitFragmentShader from "../shaders/orbit/orbit.frag";

// Mass of the sun in kilograms
const MASS_SUN = 1.98847e30;

// Universal gravitational constant in SI units
const GRAVITATIONAL_CONSTANT = 6.6743015e-11;

// Astronomical unit in metres
const ASTRONOMICAL_UNIT = 1.495978707e11;

// Default point size for asteroid points
const DEFAULT_POINT_SIZE = 2.0;

// Styles for asteroids visualization by orbit type
const ASTEROID_STYLES = new Map<OrbitType, AsteroidStyle>()
  .set(OrbitType.ORBIT_TYPE_JUPITER_TROJAN, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 1,
    color: new THREE.Color("#c8d1ea"),
  })
  .set(OrbitType.ORBIT_TYPE_Q_BOUNDED, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 1,
    color: new THREE.Color("#bde3e9"),
  })
  .set(OrbitType.ORBIT_TYPE_HUNGARIA, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 1,
    color: new THREE.Color("#bef1e8"),
  })
  .set(OrbitType.ORBIT_TYPE_NEO, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 0.35,
    color: new THREE.Color("#d3fbe5"),
  })
  .set(OrbitType.ORBIT_TYPE_HILDA, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 1,
    color: new THREE.Color("#ffc8b7"),
  })
  .set(OrbitType.ORBIT_TYPE_ASTEROID_BELT, {
    pointSize: DEFAULT_POINT_SIZE,
    alpha: 0.5,
    color: new THREE.Color("#a8414b"),
  });

/** Calculates mean motion (n) for a given semi-major axis length in AU. */
function calculateMeanMotion(a: number): number {
  return Math.sqrt(
    (GRAVITATIONAL_CONSTANT * MASS_SUN) / Math.pow(a * ASTRONOMICAL_UNIT, 3)
  );
}

interface Asteroid {
  eccentricity: number;
  semiMajorAxis: number;
  inclination: number;
  longitudeAscendingNode: number;
  argumentOfPerihelion: number;
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

    const semiMajorAxis = new Float32Array(asteroids.length);
    const meanMotion = new Float32Array(asteroids.length);
    const meanAnomaly0 = new Float32Array(asteroids.length);
    const eccentricity = new Float32Array(asteroids.length);
    const orbitalPlane = new Float32Array(asteroids.length * 3);

    for (let i = 0; i < asteroids.length; i++) {
      semiMajorAxis[i] = asteroids[i].semiMajorAxis;
      meanMotion[i] = calculateMeanMotion(asteroids[i].semiMajorAxis);
      meanAnomaly0[i] = asteroids[i].meanAnomaly;
      eccentricity[i] = asteroids[i].eccentricity;
      orbitalPlane[i * 3] = asteroids[i].longitudeAscendingNode;
      orbitalPlane[i * 3 + 1] = asteroids[i].argumentOfPerihelion;
      orbitalPlane[i * 3 + 2] = asteroids[i].inclination;
    }

    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute("a", new THREE.BufferAttribute(semiMajorAxis, 1));
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

  setTime(timeMs: number) {
    this.shaderMaterial.uniforms.time.value = timeMs / 1000.0 - this.epoch;
  }
}

export class Asteroids {
  asteroidPoints: Map<OrbitType, AsteroidPoints>;
  epochTime: number;
  timeCreated: number;

  static fromAsteroidsProto(pb: AsteroidsProto): Asteroids {
    const asteroidPoints = new Map<OrbitType, AsteroidPoints>();
    for (const asteroidGroup of pb.asteroidGroups) {
      asteroidPoints.set(
        asteroidGroup.orbitType,
        new AsteroidPoints(
          asteroidGroup.asteroids,
          pb.epochTime,
          ASTEROID_STYLES.get(asteroidGroup.orbitType) || { pointSize: 0 }
        )
      );
    }
    return new Asteroids(asteroidPoints, pb.epochTime, pb.timeCreated);
  }

  constructor(
    asteroidPoints: Map<OrbitType, AsteroidPoints>,
    epochTime: number,
    timeCreated: number
  ) {
    this.asteroidPoints = asteroidPoints;
    this.epochTime = epochTime;
    this.timeCreated = timeCreated;
  }

  showInScene(scene: THREE.Scene) {
    this.asteroidPoints.forEach((asteroidPoints) => {
      scene.add(asteroidPoints);
    });
  }

  setTime(timeMs: number) {
    this.asteroidPoints.forEach((asteroidPoints) => {
      asteroidPoints.setTime(timeMs);
    });
  }
}
