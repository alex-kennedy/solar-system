import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";

import { SolarSystem } from "@/lib/solar_system";
import { BrightStarsPoints, loadBrightStars } from "@/lib/bright_stars";
import { Asteroids, LoadAsteroids } from "@/lib/asteroids";

/**
 * True if this is a production build, false if this is a dev build (e.g.
 * running locally.)
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export class Scene {
  /** Mount element for the scene. */
  private parent: HTMLDivElement | undefined;

  private setTimeMsCallback: ((timeMs: number) => void) | null;

  /** Renderer for the animation. */
  private renderer: THREE.WebGLRenderer;

  /** Camera for the animation. */
  private camera: THREE.PerspectiveCamera;

  /** Three JS scene representing this scene. */
  private scene: THREE.Scene;

  /** Orbit controls for the scene. */
  private controls: OrbitControls;

  /** Solar system (planets, sun, and Pluto) to display in the scene. */
  private solarSystem: SolarSystem;

  /**
   * Bright stars to display in the scene. Null if they have not yet been added.
   */
  private brightStars: BrightStarsPoints | null = null;

  /**
   * Asteroids to display in the scene. Null if they have not yet been added.
   */
  private asteroids: Asteroids | null = null;

  /** Promise representing the loading of the asteroids. */
  private asteroidsPromise: Promise<Asteroids>;

  /** Animation stats element or null if stats should not be collected. */
  private stats: Stats | null = null;

  /** Frame ID from the last call to requestAnimationFrame. */
  private frameId: number | null = null;

  /** Current time for the animation, in Unix seconds. */
  private timeMs: number = Date.now();

  /** Animation timeline time for the last call to animate. */
  private lastFrameTimeMs: DOMHighResTimeStamp = 0;

  /** Rate of the animation. 1x is equivalent to real-time. */
  private animationRate = 0;

  constructor(setTimeMsCallback: ((timeMs: number) => void) | null) {
    // this.setTimeMsCallback = setTimeMsCallback;
    this.setTimeMsCallback = null;

    // Choose an initial aspect ratio. This will be updated when first mounted.
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);
    this.scene = new THREE.Scene();
    this.controls = addControls(this.camera, this.renderer.domElement);

    this.scene.add(this.camera);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Start loading the asteroids.
    this.asteroidsPromise = LoadAsteroids();
    this.asteroidsPromise.then((asteroids: Asteroids) => {
      this.showAsteroids(asteroids);
    });

    // Load the bright stars and put them on the celestial sphere.
    loadBrightStars()
      .then((brightStars: BrightStarsPoints) => {
        this.showBrightStars(brightStars);
      })
      .catch((error: any) => {
        console.error(error);
      });

    // Place the planets and their orbits in the scene.
    this.solarSystem = new SolarSystem();
    this.solarSystem.showInScene(this.scene);

    window.addEventListener("resize", this.updateDimensions);
  }

  /** Starts the scene animation. Necessary to use the controls, etc. */
  startAnimation = () => {
    if (this.frameId !== null) {
      return;
    }
    this.frameId = requestAnimationFrame(this.firstAnimate);
  };

  /** Stop and reset animation for the scene. */
  stopAnimation = () => {
    if (this.frameId === null) {
      return;
    }
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
  };

  /** Mount the scene into a parent element. */
  mount = (element: HTMLDivElement) => {
    if (this.parent !== undefined) {
      console.error("Attempted to mount already mounted scene.");
      return;
    }
    this.startAnimation();
    this.parent = element;
    element.appendChild(this.renderer.domElement);
    this.updateDimensions();

    if (!IS_PRODUCTION) {
      this.stats = addStats(this.parent);
    }
  };

  /** Unmount the scene from the parent. */
  unmount = () => {
    if (this.parent === undefined) {
      console.error("Attempted to unmount an already unmounted scene.");
      return;
    }
    this.stopAnimation();
    this.parent.removeChild(this.renderer.domElement);

    if (!IS_PRODUCTION) {
      this.parent.removeChild(this.stats.dom);
    }

    this.parent = undefined;
  };

  /** Callback to update animation dimensions when the window changes size. */
  updateDimensions = () => {
    if (this.parent === undefined) {
      return;
    }

    const width = this.parent.clientWidth;
    const height = this.parent.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  /** Sets the current time for the animation in Unix milliseconds. */
  setTime = (timeMs: number) => {
    this.timeMs = timeMs;
    this.solarSystem.setTime(timeMs);
    if (this.asteroids !== null) {
      this.asteroids.setTime(timeMs);
    }
    this.setTimeMsCallback ? this.setTimeMsCallback(timeMs) : null;
  };

  /** Returns the current time of the animation in Unix milliseconds. */
  getTime = (): number => {
    return this.timeMs;
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

  getAsteroids = (): Promise<Asteroids> => {
    return this.asteroidsPromise;
  };

  private showAsteroids = (asteroids: Asteroids) => {
    this.asteroids = asteroids;
    asteroids.setTime(this.timeMs);
    this.asteroids.showInScene(this.scene);
  };

  private firstAnimate = (timestamp: DOMHighResTimeStamp) => {
    this.lastFrameTimeMs = timestamp;
    this.frameId = requestAnimationFrame(this.animate);
  };

  private animate = (timestamp: DOMHighResTimeStamp) => {
    this.beginStats();

    this.setTime(
      this.timeMs + (timestamp - this.lastFrameTimeMs) * this.animationRate
    );
    this.lastFrameTimeMs = timestamp;

    this.solarSystem.scale(this.camera);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    this.endStats();

    // Schedules the next animation
    this.frameId = requestAnimationFrame(this.animate);
  };

  private beginStats = () => {
    this.stats?.begin();
  };

  private endStats = () => {
    this.stats?.end();
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
