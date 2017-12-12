"use strict";

var width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

var height = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

console.log("Width = " + width);
console.log("Height = " + height);

const WIDTH = width - 10;
const HEIGHT = height - 10;

const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.1;
const FAR = 1000;

const container = document.querySelector('#container');

const renderer = new THREE.WebGLRenderer();
const camera =
  new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR
  );

  const scene = new THREE.Scene();

  scene.add(camera)

  renderer.setSize(WIDTH, HEIGHT);

  container.appendChild(renderer.domElement);

  const RADIUS = 50;
  const SEGMENTS = 16;
  const RINGS = 16;

  const sphereMaterial =
    new THREE.MeshLambertMaterial(
      {
        color: 0xCC0000
      });

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      RADIUS,
      SEGMENTS,
      RINGS
    ),
    sphereMaterial
  );

  sphere.position.z = -300;

  scene.add(sphere)

  const pointLight =
    new THREE.PointLight(0xFFFFFF);

  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;

  scene.add(pointLight);

  var controls = new THREE.OrbitControls(camera);
  camera.position.set(0, 20, 100);
  controls.update()

  function update () {
    renderer.render(scene, camera);
    controls.update();

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
