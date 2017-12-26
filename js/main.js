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
var geometry, data, bright_stars, i, material, particles, size, x, y, z, star, star_size, star_opacity;

var particle_basic = {
    'particle_basic': {

        uniforms: THREE.UniformsUtils.merge([

            THREE.UniformsLib["particle"],
            THREE.UniformsLib["shadowmap"]

        ]),

        vertexShader: [

            "uniform float size;",
            "uniform float scale;",

            THREE.ShaderChunk["color_pars_vertex"],
            THREE.ShaderChunk["shadowmap_pars_vertex"],
            THREE.ShaderChunk["logdepthbuf_pars_vertex"],

            "void main() {",

            THREE.ShaderChunk["color_vertex"],

            "	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

            "	#ifdef USE_SIZEATTENUATION",
            "		gl_PointSize = size * ( scale / length( mvPosition.xyz ) );",
            "	#else",
            "		gl_PointSize = size;",
            "	#endif",

            "	gl_Position = projectionMatrix * mvPosition;",

            THREE.ShaderChunk["logdepthbuf_vertex"],
            THREE.ShaderChunk["worldpos_vertex"],
            THREE.ShaderChunk["shadowmap_vertex"],

            "}"

        ].join("\n"),

        fragmentShader: [

            "uniform vec3 psColor;",
            "uniform float opacity;",

            THREE.ShaderChunk["color_pars_fragment"],
            THREE.ShaderChunk["map_particle_pars_fragment"],
            THREE.ShaderChunk["fog_pars_fragment"],
            THREE.ShaderChunk["shadowmap_pars_fragment"],
            THREE.ShaderChunk["logdepthbuf_pars_fragment"],

            "void main() {",

            "	gl_FragColor = vec4( psColor, opacity );",

            THREE.ShaderChunk["logdepthbuf_fragment"],
            THREE.ShaderChunk["map_particle_fragment"],
            THREE.ShaderChunk["alphatest_fragment"],
            THREE.ShaderChunk["color_fragment"],
            THREE.ShaderChunk["shadowmap_fragment"],
            THREE.ShaderChunk["fog_fragment"],

            "}"

        ].join("\n")

    }
}

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
    star_size = [];
    star_opacity = [];

    for(i = 1; i < bright_stars.length; i++) {
        star = new THREE.Vector3();
        star.x = Number(bright_stars[i][1]);
        star.y = Number(bright_stars[i][2]);
        star.z = Number(bright_stars[i][3]);

        geometry.vertices.push(star);

        star_size.push(Number(bright_stars[i][0]) * 100);
        star_opacity.push(1);
    }

    var attributes = {
        pSize: {type: 'f', value: star_size},
        pOpacity: {type: 'f', value: star_opacity}
    };

    var basicShader = particle_basic['particle_basic'];
    var uniforms = THREE.UniformsUtils.merge([basicShader['uniforms']]);
    uniforms['map'].value = THREE.ImageUtils.loadTexture("assets/textures/star.png");
    uniforms['size'].value = 100;
    uniforms['opacity'].value = 1;
    uniforms['psColor'].value = new THREE.Color(0xffffff);

    var psMat2 = new THREE.ShaderMaterial({
        attributes: attributes,
        uniforms: uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexShader: document.
            getElementById('particleVertexShader').text,
        fragmentShader: document.
            getElementById('particleFragmentShader').text
    });

    var particles = new THREE.PointCloud(geometry, psMat2);
    particles.sortParticles = true;

    particles.position.x = 0;
    particles.position.z = 0;

    scene.add(particles)

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