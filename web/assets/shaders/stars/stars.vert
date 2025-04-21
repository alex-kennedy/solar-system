attribute float size;
attribute vec3 color_shader;

varying vec3 vColor;

void main() {

  vColor = color_shader;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
