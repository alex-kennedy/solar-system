import * as THREE from "three";

import starTexture from "@/assets/stars/star.svg";
import starFragmentShader from "@/assets/shaders/stars/stars.frag";
import starVertexShader from "@/assets/shaders/stars/stars.vert";
import { BrightStars, BrightStar } from "@/lib/proto/bright_stars";
import { fetchBrotliAsArray } from "@/lib/brotli";

const RADIUS = 100;
const INTENSITY_SCALE = 5.0;
const PUBLIC_PATH = "/api/brightstars.pb.br";

/** Construct bright stars from the default proto path. */
export async function loadBrightStars(): Promise<BrightStarsPoints> {
  const data = await fetchBrotliAsArray(PUBLIC_PATH);
  const pb = BrightStars.decode(data);
  return new BrightStarsPoints(pb);
}

/**
 * Points object for stars. Each star is represented as an image scaled to its
 * intensity.
 */
export class BrightStarsPoints extends THREE.Points {
  constructor(stars: BrightStars) {
    const sizes = new Float32Array(stars.brightStars.length);
    const positions = new Float32Array(stars.brightStars.length * 3);
    const colors = new Float32Array(stars.brightStars.length * 3);

    const color = new THREE.Color(1, 1, 1); // White

    for (let i = 0; i < stars.brightStars.length; i++) {
      const star = stars.brightStars[i];
      const position = getStarPosition(star);

      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z; // z

      sizes[i] = star.intensity * INTENSITY_SCALE;

      color.toArray(colors, i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("color_shader", new THREE.BufferAttribute(colors, 3));

    const texture = new THREE.TextureLoader().load(starTexture.src);
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

/** Computes the 3D position of the star. */
function getStarPosition(star: BrightStar): THREE.Vector3 {
  return new THREE.Vector3(
    RADIUS * Math.cos(star.declination) * Math.cos(star.rightAscension),
    RADIUS * Math.cos(star.declination) * Math.sin(star.rightAscension),
    RADIUS * Math.sin(star.declination)
  );
}
