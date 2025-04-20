uniform vec3 color;
uniform sampler2D starTexture;

varying vec3 vColor;

void main() {
  vec4 color = vec4(color * vColor, 1.0) * texture2D(starTexture, gl_PointCoord);

  gl_FragColor = color;
}
