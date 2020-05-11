import React, { Component } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import decompress from "brotli/decompress";
import Stats from 'three/examples/jsm/libs/stats.module';

import { Planet } from "./Orbit.js";
import * as starShaders from "../assets/shaders/stars";

import stars_texture from "./../assets/stars/star.svg";
import planets from "./../assets/planets/planetary_elements.json";

const fetchBrotliAsJSON = async (path) => {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  const decompressed = decompress(Buffer(buffer));
  return JSON.parse(new TextDecoder("utf-8").decode(decompressed));
};

class Scene extends Component {
  constructor(props) {
    super(props);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.renderBrightStars = this.renderBrightStars.bind(this);
  }

  componentDidMount() {
    this.createScene();

    this.addControls();
    this.addStats();
    this.loadBrightStars();
    this.addSun();
    this.addPlanets(planets);

    // this.addCelestialSphereWireframe();

    window.addEventListener("resize", this.updateDimensions);
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
    this.controls = controls;
  }

  addStats() {
    const stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.stats = stats;
    this.mount.appendChild(this.stats.domElement);
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

  renderBrightStars(bright_stars) {
    console.log(bright_stars);

    const sizes = new Float32Array(bright_stars.length);
    const positions = new Float32Array(bright_stars.length * 3);
    const colors = new Float32Array(bright_stars.length * 3);

    const color = new THREE.Color(1, 1, 1);

    for (let i = 0; i < bright_stars.length; i++) {
      positions[i * 3] = bright_stars[i][1]; // x
      positions[i * 3 + 1] = bright_stars[i][2]; // y
      positions[i * 3 + 2] = bright_stars[i][3]; // z

      sizes[i] = bright_stars[i][0] / 2;

      color.toArray(colors, i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.addAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.addAttribute("color_shader", new THREE.BufferAttribute(colors, 3));

    const texture = new THREE.TextureLoader().load(stars_texture);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        texture: { value: texture },
      },
      vertexShader: starShaders.vertexShader,
      fragmentShader: starShaders.fragmentShader,
      transparent: true,
    });

    const stars = new THREE.Points(geometry, material);
    this.scene.add(stars);
  }

  addSun() {
    const geometry = new THREE.Geometry();

    const vertex = new THREE.Vector3();
    vertex.x = 0;
    vertex.y = 0;
    vertex.z = 0;

    geometry.vertices.push(vertex);

    const material = new THREE.PointsMaterial({ size: 1 });
    material.color.setRGB(1, 0.25, 0);
    const particles = new THREE.Points(geometry, material);

    this.scene.add(particles);
  }

  addPlanets(planets_file) {
    const planets = [];

    for (let system_name in planets_file) {
      if (planets_file.hasOwnProperty(system_name)) {
        const planet = new Planet(system_name, planets_file[system_name]);
        planet.initialiseOrbit();
        planets.push(planet);
      }
    }

    const geometry = new THREE.Geometry();

    for (let i = 0; i < planets.length; i++) {
      geometry.vertices.push(planets[i].currentPosition);
      planets[i].showInScene(this.scene, this.camera); //, colours[i]
    }

    const size = 1;
    const material = new THREE.PointsMaterial({ size: size });
    material.color.setRGB(1, 1, 1);
    const particles = new THREE.Points(geometry, material);

    this.planets = planets;

    this.scene.add(particles);
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

    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    this.stats.end();

    // requestAnimationFrame(animate);
    this.frameId = window.requestAnimationFrame(this.animate);
  }

  render() {
    return (
      <div
        style={{ width: "100%", height: "100%" }}
        ref={(mount) => {
          this.mount = mount;
        }}
      />
    );
  }
}

export default Scene;
