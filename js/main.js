"use strict";

// Establish the environment
var WIDTH = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;
var HEIGHT = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

var aspect = WIDTH / HEIGHT;
var container;
var renderer, camera, scene;
var geometry, data, bright_stars, i, material, particles, size, x, y, z, star, star_size;


// Declare the scene
container = document.querySelector('#container');
renderer = new THREE.WebGLRenderer();
camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);
scene = new THREE.Scene();

scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);
container.appendChild(renderer.domElement);

// Controls
var controls = new THREE.OrbitControls(camera);
camera.position.set(0, 0, 20);
controls.enableDamping = true;
controls.dampingFactor = 0.3;
controls.update();

// Add page statistics
var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
container.appendChild( stats.dom );

// Resize event listener
window.addEventListener("resize", resetRenderSize);
function resetRenderSize() {
    WIDTH = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

// Add the celestial sphere wire frame
var radius = 100;
var segments = 100;
var rings = 100;

geometry = new THREE.SphereGeometry(radius, segments, rings);
var material = new THREE.MeshBasicMaterial({
    color: 0x525252,
    wireframe: true
});

var sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Add the stars on the celestial sphere
$.get('bright_stars/bright_stars.csv', loadBrightStars);

function loadBrightStars(data) {
    bright_stars = $.csv.toArrays(data);

    geometry = new THREE.Geometry();
    star_size = []

    for(i = 1; i < bright_stars.length; i++) {
        var star = new THREE.Vector3();
        star.x = Number(bright_stars[i][1]);
        star.y = Number(bright_stars[i][2]);
        star.z = Number(bright_stars[i][3]);

        geometry.vertices.push(star);

        star_size.push(Number(bright_stars[i][0]) * 100)
    }

    material = new THREE.PointCloudMaterial({
        size: 1
    });

    particles = new THREE.PointCloud(geometry, material);
    scene.add(particles);

}

// Animation loop
function animate() {
    stats.begin();

    renderer.render(scene, camera);
    controls.update();

    stats.end();

    requestAnimationFrame(animate);
}

animate();