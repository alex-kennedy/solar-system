import React, { Component } from 'react';
import * as THREE from 'three-full';
import { OrbitControls } from  'three-full'
import * as Stats from 'stats-js'
import * as $ from 'jquery'
import * as csv from 'parse-csv'

import { Planet } from './Orbit.js'

import stars_file from './../assets/stars/bright_stars.csv'
import stars_texture from './../assets/stars/star.svg'
import planets from './../assets/planets/planetary_elements.json'

class Scene extends Component {
    constructor(props) {
        super(props)
    
        this.start = this.start.bind(this)
        this.stop = this.stop.bind(this)
        this.animate = this.animate.bind(this)
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
        const aspect = width/height;

        const renderer = new THREE.WebGLRenderer();
        const camera = new THREE.PerspectiveCamera(
            45, 
            aspect, 
            0.001, 
            100000
        );

        const scene = new THREE.Scene();
    
        scene.add(camera);
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);

        this.renderer = renderer
        this.camera = camera
        this.scene = scene

        this.mount.appendChild(this.renderer.domElement)

        this.start()
    }

    addControls() {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.set(0, 0, 20);
        controls.enableDamping = true;
        controls.dampingFactor = 0.15;
        controls.rotateSpeed = 0.15;
        controls.maxDistance = 100;

        this.controls = controls
    }

    addStats() {
        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        this.stats = stats
        this.mount.appendChild(this.renderer.domElement);
    }

    addCelestialSphereWireframe() {
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
        this.scene.add(sphere);
    }

    loadBrightStars() {
        $.get(stars_file, this.renderBrightStars);
    } 

    renderBrightStars(data) {
        var parser = new csv.Parser();
        var bright_stars = parser.parse(data).data;

        // console.log(bright_stars)

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

            sizes[i] = Number(bright_stars[i][0]) / 2.25;

            color.toArray(colors, i * 3);
        }

        var geometry = new THREE.BufferGeometry();
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.addAttribute('color_shader', new THREE.BufferAttribute(colors, 3));

        var texture = new THREE.TextureLoader().load(stars_texture);

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
        this.scene.add(stars)
    }

    addSun() {
        var geometry = new THREE.Geometry();
    
        var vertex = new THREE.Vector3();
        vertex.x = 0;
        vertex.y = 0;
        vertex.z = 0;
    
        geometry.vertices.push(vertex);
    
        var material = new THREE.PointsMaterial( {size: 1} );
        material.color.setRGB(1, 0.25, 0);
        var particles = new THREE.Points( geometry, material );
    
        this.scene.add(particles);
    }

    addPlanets(planets_file) {
        var planets = [];

        for (var system_name in planets_file) {

            if (planets_file.hasOwnProperty(system_name)) {
                
                var planet = new Planet(system_name, planets_file[system_name]);
                planet.initialiseOrbit();
                planets.push(planet);

            }

        }
        
        var geometry = new THREE.Geometry();

        for ( var i = 0; i < planets.length; i ++ ) {

            geometry.vertices.push(planets[i].currentPosition);
            planets[i].showInScene(this.scene, this.camera); //, colours[i]

        }

        var size = 1;
        var material = new THREE.PointsMaterial( {size: size} );
        material.color.setRGB(1, 1, 1);
        var particles = new THREE.Points( geometry, material );

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
        this.stop()
        this.mount.removeChild(this.renderer.domElement)
    }

    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate)
        }
    }

    stop() {
        cancelAnimationFrame(this.frameId)
    }

    animate() {
        this.stats.begin();

        this.renderer.render(this.scene, this.camera);
        this.controls.update();

        this.stats.end();

        // requestAnimationFrame(animate);
        this.frameId = window.requestAnimationFrame(this.animate)
    }


    render() {
        return (
        <div
            style={{ width: '100%', height: '100%' }}
            ref={(mount) => { this.mount = mount }}
        />
        )
    }
}

export default Scene