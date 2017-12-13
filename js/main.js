"use strict";

var WIDTH = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

var HEIGHT = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

var aspect = WIDTH / HEIGHT
var container;
var renderer, camera, scene;

console.log("Width = " + WIDTH);
console.log("Height = " + HEIGHT);

container = document.querySelector('#container');
renderer = new THREE.WebGLRenderer();
camera = new THREE.PerspectiveCamera(
    45,
    aspect,
    1,
    1000
);

scene = new THREE.Scene();
scene.add(camera);

renderer.setSize(WIDTH, HEIGHT);

container.appendChild(renderer.domElement);

renderer.render(scene, camera);

var radius = 100;
var segments = 100;
var rings = 100;

var geometry = new THREE.SphereGeometry(radius, segments, rings);
var material = new THREE.MeshBasicMaterial({
    color: 0x525252,
    wireframe: true
});

var sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

var controls = new THREE.OrbitControls(camera);
camera.position.set(0, 0, 20);
controls.update();
controls.enableDamping = true;
controls.dampingFactor = 0.35;

radius = 0.00465;
geometry = new THREE.SphereGeometry(radius, segments, rings);
material = new THREE.MeshBasicMaterial({
    color: 0xFFF5EE
});
var sun = new THREE.Mesh(geometry, material);
scene.add(sun)

var light = new THREE.PointLight( 0xff0000, 1, 100, 2);
scene.add(light);


function animate() {
    renderer.render(scene, camera);
    controls.update();

    requestAnimationFrame(animate);
}

animate();