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

        for (var system_name in data) {
            if (data.hasOwnProperty(system_name)) {
                planets.push(new Planet(system_name, data[system_name]));
            }
        }

        console.log(planets);

    }
}


function getNowTT() {
  // Get the current time as a unix seconds, but in Terrestrial Time
  return Date.now() / 1000 + 69.184;
}


function getCenturiesTT() {
  // Get the number of centuries that have elapsed since J2000.0, TT
  var nowTT = getNowTT();
  return ((nowTT / 86400.0) - 10957.5) / 36525;
}




function OrbitingObject(name, a, e, I, L, long_peri, long_node) {
    this.name = name || "";
    this.a = a;
    this.e = e;
    this.I = I;
    this.L = L;
    this.long_peri = long_peri;
    this.long_node = long_node;

    this.solveKepler = function (tol) {
        // Currently only solves in degrees
        tol = typeof tol !== 'undefined' ? tol : 1.e-5;

        var e_star = (180 / Math.PI) * this.e;
        var E_n = this.M + e_star * Math.sin((Math.PI / 180) * this.M);
        var delta = 360;

        while (Math.abs(delta) < tol) {
            delta = (this.M - (E_n - e_star * Math.sin((Math.PI / 180) * E_n))) / (1 - this.e * Math.cos((Math.PI / 180) * E_n));
            E_n = E_n + delta;
        }

        return E_n;

    };
}

OrbitingObject.prototype = {

    constructor: OrbitingObject

};


function Planet(name, elements) {

    this.time_centuries = getCenturiesTT();

    for (var key in elements) {
        if (elements.hasOwnProperty(key)) {
            elements[key] = elements[key][0] + this.time_centuries * elements[key][1];
        }
    }

    OrbitingObject.call(this, name, elements['a'], elements['e'], elements['I'], elements['L'], elements['long_peri'], elements['long_node']);

    this.arg_peri = this.long_peri - this.long_node;
    this.M = ((this.L - this.long_peri - 180) % 360) + 180;


}

Planet.prototype = Object.create(OrbitingObject.prototype, {

    constructor: Planet

});


init();
animate();
