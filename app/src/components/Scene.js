import * as THREE from "three";

import React, { Component } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Planet } from "../lib/orbit";
import Stats from "three/examples/jsm/libs/stats.module";
import asteroidStyles from "./../assets/asteroids/styles.json";
import planetColours from "./../assets/planets/colours.json";
import planetElements from "./../assets/planets/planetary_elements.json";
import starTexture from "./../assets/stars/star.svg";
import { fetchBrotliAsJSON } from "./../lib/brotli";
import AsteroidsWorker from "./../workers/asteroids.worker";
import LoaderSnackbar from "./LoaderSnackbar";
import LoadErrorSnackbar from "./LoadErrorSnackbar";
import { AsteroidPoints } from "../lib/asteroid_points";

import starFragmentShader from "../shaders/stars/stars.frag";
import starVertexShader from "../shaders/stars/stars.vert";

class Scene extends Component {
  constructor(props) {
    super(props);

    this.shaderMaterial = null;
    this.asteroidPoints = {};

    this.state = { loadingAsteroids: true, loadingAsteroidsError: false };

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.renderBrightStars = this.renderBrightStars.bind(this);
    this.handleAsteroidLoadFailure = this.handleAsteroidLoadFailure.bind(this);
    this.handleAsteroidErrorClose = this.handleAsteroidErrorClose.bind(this);
    this.renderAsteroids = this.renderAsteroids.bind(this);
    this.handleAsteroidWorkerMessage =
      this.handleAsteroidWorkerMessage.bind(this);
  }

  componentDidMount() {
    this.createScene();

    window.addEventListener("resize", this.updateDimensions);

    this.loadBrightStars();
    this.addControls();
    this.addStats();
    this.addPlanets();
    this.addSun();

    this.asteroidsWorker = new AsteroidsWorker();
    this.asteroidsWorker.onmessage = this.handleAsteroidWorkerMessage;
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
    this.mount.appendChild(this.stats.domElement); // lazily comment it out for prod
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

  loadBrightStars() {
    fetchBrotliAsJSON(
      process.env.PUBLIC_URL + "/assets/bright_stars.json.br"
    ).then(this.renderBrightStars);
  }

  renderBrightStars(brightStars) {
    const sizes = new Float32Array(brightStars.length);
    const positions = new Float32Array(brightStars.length * 3);
    const colors = new Float32Array(brightStars.length * 3);

    const color = new THREE.Color(1, 1, 1);

    for (let i = 0; i < brightStars.length; i++) {
      positions[i * 3] = brightStars[i][1]; // x
      positions[i * 3 + 1] = brightStars[i][2]; // y
      positions[i * 3 + 2] = brightStars[i][3]; // z

      sizes[i] = brightStars[i][0] / 2; // manually scaled brightness

      color.toArray(colors, i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("color_shader", new THREE.BufferAttribute(colors, 3));

    const texture = new THREE.TextureLoader().load(starTexture);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        starTexture: { value: texture },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
    });

    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
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
      this.renderAsteroids(message.data.points);
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

  renderAsteroids(pointsByType) {
    for (let [type, a] of Object.entries(pointsByType)) {
      const points = new AsteroidPoints(a.asteroids, a.epoch, {
        alpha: asteroidStyles.opacity[type],
        color: new THREE.Color(asteroidStyles.colours[type]),
        pointSize: 2.0,
      });
      this.scene.add(points);
      this.asteroidPoints[type] = points;
    }

    // Use the current time for asteroid positions.
    this.setAsteroidTime(Date.now() / 1000);

    this.setState({ loadingAsteroids: false });
  }

  setAsteroidTime(time) {
    for (let points of Object.values(this.asteroidPoints)) {
      points.setTime(time);
    }
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
