import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

import { SolarSystem } from "./solar_system";
import { BrightStarsPoints } from "./bright_stars";
import { Asteroids } from "./asteroids";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export class Scene {
  mount: HTMLDivElement;

  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  controls: OrbitControls;

  solarSystem: SolarSystem;
  brightStars: BrightStarsPoints | null = null;
  asteroids: Asteroids | null = null;

  stats: Stats | null = null;
  frameId: number | null = null;

  constructor(mount: HTMLDivElement) {
    this.mount = mount;

    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);
    this.scene = new THREE.Scene();
    this.controls = addControls(this.camera, this.renderer.domElement);

    this.scene.add(this.camera);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.mount.appendChild(this.renderer.domElement);

    if (!IS_PRODUCTION) {
      this.stats = addStats(mount);
    }

    this.solarSystem = new SolarSystem();
    this.solarSystem.showInScene(this.scene);
  }

  startAnimation = () => {
    if (this.frameId !== null) {
      return;
    }
    this.frameId = requestAnimationFrame(this.animate);
  };

  stopAnimation = () => {
    if (this.frameId === null) {
      return;
    }
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  };

  unmount = () => {
    this.stopAnimation();
    this.mount.removeChild(this.renderer.domElement);
  };

  updateDimensions = () => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  setTime = (time: number) => {
    if (this.asteroids !== null) {
      this.asteroids.setTime(time);
    }
  };

  showCelestialSphereWireframe = () => {
    const radius = 100;
    const segments = 100;
    const rings = 100;

    const geometry = new THREE.SphereGeometry(radius, segments, rings);
    const material = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      wireframe: true,
    });
    material.side = THREE.DoubleSide;

    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);
  };

  showBrightStars = (brightStars: BrightStarsPoints) => {
    this.brightStars = brightStars;
    this.scene.add(brightStars);
  };

  showAsteroids = (asteroids: Asteroids) => {
    this.asteroids = asteroids;
    this.asteroids.showInScene(this.scene);
  };

  private animate = () => {
    this.beginStats();

    this.solarSystem.scale(this.camera);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    this.endStats();

    // Schedules the next animation
    this.frameId = requestAnimationFrame(this.animate);
  };

  private beginStats = () => {
    if (this.stats !== null) {
      this.stats.begin();
    }
  };

  private endStats = () => {
    if (this.stats !== null) {
      this.stats.end();
    }
  };
}

function addControls(
  camera: THREE.Camera,
  domElement: HTMLCanvasElement
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  camera.position.set(0, 0, 20);
  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  controls.rotateSpeed = 0.5;
  controls.maxDistance = 100;
  controls.enablePan = false;
  return controls;
}

function addStats(mount: HTMLDivElement): Stats {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  mount.appendChild(stats.dom);
  return stats;
}
