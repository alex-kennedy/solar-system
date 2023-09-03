import * as THREE from "three";

import starTexture from "./../assets/stars/star.svg";
import starFragmentShader from "../shaders/stars/stars.frag";
import starVertexShader from "../shaders/stars/stars.vert";

class BrightStars extends THREE.Points {
  /** 
   * Points object for stars. Constructed from a list of stars where each star
   * is a list of the intensity and cartesian coordinates [intensity, x, y, z].
   */
  constructor(stars: number[][]) {
    const sizes = new Float32Array(stars.length);
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);

    const color = new THREE.Color(1, 1, 1); // White

    for (let i = 0; i < stars.length; i++) {
      positions[i * 3] = stars[i][1]; // x
      positions[i * 3 + 1] = stars[i][2]; // y
      positions[i * 3 + 2] = stars[i][3]; // z

      sizes[i] = stars[i][0] / 2; // manually scaled intensity

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

    super(geometry, material);
  }
}

export { BrightStars };
