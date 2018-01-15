"use strict";

var WIDTH = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

var aspect = WIDTH / HEIGHT;
var container;
var renderer, camera, scene, controls, stats;


function init() {
    console.time();

    createScene();

    addControls();
    addStats();
    addBrightStars();
    addPlanets();

    console.timeEnd();
}


// Animation loop
function animate() {
    stats.begin();

    renderer.render(scene, camera);
    controls.update();
    stats.end();

    requestAnimationFrame(animate);
}


// Resize event listener
window.addEventListener("resize", resetRenderSize);
function resetRenderSize() {
    WIDTH = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}


function createScene() {
    container = document.querySelector('#container');
    renderer = new THREE.WebGLRenderer();
    camera = new THREE.PerspectiveCamera(45, aspect, 0.001, 100000);
    scene = new THREE.Scene();

    scene.add(camera);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
}


function addControls() {
    controls = new THREE.OrbitControls(camera, container);
    camera.position.set(0, 0, 20);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.rotateSpeed = 0.15;
    controls.maxDistance = 100;
}

function addStats() {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    container.appendChild(stats.dom);
}


function addCelestialSphereWireframe() {
    var radius = 100;
    var segments = 100;
    var rings = 100;

    var geometry = new THREE.SphereGeometry(radius, segments, rings);
    var material = new THREE.MeshBasicMaterial({
        color: 0xAAAAAA,
        wireframe: true
    });
    material.side = THREE.DoubleSide;

    var sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}


function addBrightStars() {
    $.get('astro/bright_stars/bright_stars.csv', renderBrightStars);
    function renderBrightStars(data) {
        var bright_stars = $.csv.toArrays(data);

        //Remove the column headers
        bright_stars = bright_stars.slice(1);

        var sizes = new Float32Array(bright_stars.length);
        var positions = new Float32Array(bright_stars.length * 3);
        var colors = new Float32Array(bright_stars.length * 3);

        var color = new THREE.Color(1, 1, 1);

        for (var i = 0; i < bright_stars.length; i++) {
            positions[i * 3] = Number(bright_stars[i][1]);          // x
            positions[i * 3 + 1] = Number(bright_stars[i][2]);      // y
            positions[i * 3 + 2] = Number(bright_stars[i][3]);      // z

            sizes[i] = Number(bright_stars[i][0]) / 2;

            color.toArray(colors, i * 3);
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.addAttribute('color_shader', new THREE.BufferAttribute(colors, 3));

        var texture = new THREE.TextureLoader().load('assets/textures/star.png');

        var material = new THREE.ShaderMaterial({
            uniforms: {
                color: {value: new THREE.Color(0xffffff)},
                texture: {value: texture}
            },
            vertexShader: document.getElementById('vertexshader').textContent,
            fragmentShader: document.getElementById('fragmentshader').textContent,
            transparent: true
        });

        var stars = new THREE.Points(geometry, material);
        scene.add(stars)
    }
}


function addPlanets() {
    var planets = [];

    $.get('astro/planets/planetary_elements.json', processPlanets);
    function processPlanets(data) {

        for (var i = 0; i < data.length; i++) {
            planets[i] = new Planet(data[i]);
        }
console.log(planets);
    }
}


function OrbitingObject(semi_major_axis, eccentricity, inclination, mean_long, arg_peri, long_asc_node) {
    this.semi_major_axis = semi_major_axis;
    this.eccentricity = eccentricity;
    this.inclination = inclination;
    this.mean_long = mean_long;
    this.arg_peri = arg_peri;
    this.long_asc_node = long_asc_node;

    this.time_of_orbit = Date.now();
}

OrbitingObject.prototype = {

    constructor: OrbitingObject

};


function Planet(data) {

    this.name = data.name || "";

    var time_centuries = (Date.now() - Date.UTC(2000, 0, 1, 12, 0, 0)) / (1000 * 60 * 60 * 24 * 36525);

    var elements = [];
    for (var i = 0; i < data.elements.length; i++) {

        elements.push(data.elements[i] + time_centuries * data.deltas[i])

    }

    var semi_major_axis = elements[0];
    var eccentricity = elements[1];
    var inclination = elements[2];
    var mean_long = elements[3];
    var long_peri = elements[4];
    var long_asc_node = elements[5];

    var arg_peri = long_peri - long_asc_node;

    OrbitingObject.call(this, semi_major_axis, eccentricity, inclination, mean_long, arg_peri, long_asc_node);

    this.mean_anomaly = ((mean_long - long_peri + 180) % 360) - 180;

}

Planet.prototype = Object.create(OrbitingObject.prototype, {

    constructor: Planet

});


init();
animate();

