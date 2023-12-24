import * as THREE from "three";

import React, { Component } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Planet } from "../lib/planets";
import { loadBrightStars } from "../lib/bright_stars";
import Stats from "three/examples/jsm/libs/stats.module";
import planetColours from "./../assets/planets/colours.json";
import planetElements from "./../assets/planets/planetary_elements.json";
import AsteroidsWorker from "../workers/asteroids.worker";
import LoaderSnackbar from "./LoaderSnackbar";
import LoadErrorSnackbar from "./LoadErrorSnackbar";
import { Asteroids } from "../lib/asteroids";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

class Scene extends Component {
  constructor(props) {
    super(props);

    this.shaderMaterial = null;
    this.asteroids = null;

    this.state = { loadingAsteroids: true, loadingAsteroidsError: false };

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.handleAsteroidLoadFailure = this.handleAsteroidLoadFailure.bind(this);
    this.handleAsteroidErrorClose = this.handleAsteroidErrorClose.bind(this);
    this.renderAsteroids = this.renderAsteroids.bind(this);
    this.handleAsteroidWorkerMessage =
      this.handleAsteroidWorkerMessage.bind(this);
  }

  componentDidMount() {
    this.createScene();

    window.addEventListener("resize", this.updateDimensions);

    this.renderBrightStars();
    this.addControls();
    this.addStats();
    this.addPlanets();
    this.addSun();

    this.asteroidsWorker = new AsteroidsWorker();
    this.asteroidsWorker.onmessage =
      this.handleAsteroidWorkerMessage.bind(this);
    this.asteroidsWorker.postMessage({ cmd: "init" });

    window.scene = this;
  }

  createScene() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    const aspect = width / height;

    const renderer = new THREE.WebGLRenderer();
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);

    const scene = new THREE.Scene();

    scene.add(camera);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;

    this.mount.appendChild(this.renderer.domElement);

    this.start();
  }

  addControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, 20);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.rotateSpeed = 0.5;
    controls.maxDistance = 100;
    controls.enablePan = false;
    this.controls = controls;
  }

  addStats() {
    const stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats = stats;
    if (!IS_PRODUCTION) {
      this.mount.appendChild(this.stats.domElement);
    }
  }

  addCelestialSphereWireframe() {
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
  }

  renderBrightStars() {
    loadBrightStars()
      .then((stars) => this.scene.add(stars))
      .catch((err) => console.error("failed to load stars!", err));
  }

  addSun() {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#F9D670"),
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);
    this.sun = sphere;
  }

  addPlanets() {
    const planets = [];

    // Adds the orbits of the planets
    for (let systemName in planetElements) {
      if (planetElements.hasOwnProperty(systemName)) {
        const planet = new Planet(
          systemName,
          planetElements[systemName],
          planetColours[systemName]
        );
        planet.initialiseOrbit();
        planets.push(planet);
      }
    }

    // Adds the sphere/dot representing each planet
    for (let i = 0; i < planets.length; i++) {
      planets[i].showInScene(this.scene, this.camera);

      let geometry = new THREE.SphereGeometry(1, 16, 16);
      let material = new THREE.MeshBasicMaterial({
        color: planetColours[planets[i].name],
      });

      let sphere = new THREE.Mesh(geometry, material);
      let pos = planets[i].currentPosition;
      sphere.position.set(pos.x, pos.y, pos.z);
      planets[i].mesh = sphere;

      this.scene.add(sphere);
    }

    this.planets = planets;
  }

  handleAsteroidWorkerMessage(message) {
    if (message.data.cmd === "error") {
      this.handleAsteroidLoadFailure();
    } else if (message.data.cmd === "initComplete") {
      this.renderAsteroids(message.data.asteroids);
    }
  }

  handleAsteroidLoadFailure() {
    this.setState({ loadingAsteroids: false, loadingAsteroidsError: true });
  }

  handleAsteroidErrorClose(event, reason) {
    if (reason === "clickaway") {
      return;
    }
    this.setState({ loadingAsteroidsError: false });
  }

  renderAsteroids(asteroidsProto) {
    this.asteroids = Asteroids.fromAsteroidsProto(asteroidsProto);
    this.asteroids.asteroidPoints.forEach((asteroidPoints) => {
      this.scene.add(asteroidPoints);
    });

    // Use the current time for asteroid positions.
    this.setAsteroidTime(Date.now() / 1000);
    this.setState({ loadingAsteroids: false });
  }

  setAsteroidTime(time) {
    this.asteroids.setTime(time);
  }

  requestAsteroidUpdate(t) {
    this.asteroidsWorker.postMessage({ cmd: "update", t: t });
  }

  updateDimensions() {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  start() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  animate() {
    this.stats.begin();

    // Scale planets, sun
    const scaleFactor = 250;
    const scaleVector = new THREE.Vector3();
    for (let i = 0; i < this.planets.length; i++) {
      let scale =
        scaleVector
          .subVectors(this.planets[i].mesh.position, this.camera.position)
          .length() / scaleFactor;
      this.planets[i].mesh.scale.set(scale, scale, scale);
    }
    let scale =
      scaleVector.subVectors(this.sun.position, this.camera.position).length() /
      scaleFactor;
    this.sun.scale.set(scale, scale, scale);

    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    this.stats.end();

    this.frameId = requestAnimationFrame(this.animate);
  }

  render() {
    return (
      <>
        <div
          style={{ width: "100%", height: "100%" }}
          ref={(mount) => {
            this.mount = mount;
          }}
        />
        <LoaderSnackbar open={this.state.loadingAsteroids} />
        <LoadErrorSnackbar
          open={this.state.loadingAsteroidsError}
          handleClose={this.handleAsteroidErrorClose}
        />
      </>
    );
  }
}

export default Scene;
