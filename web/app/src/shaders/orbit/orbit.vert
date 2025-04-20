#define PI 3.14159265358979

uniform float time;  // Time in seconds relative to epoch time
uniform float size;  // Particle size
uniform float alpha; // Particle opacity

attribute float a;              // semi-major axis, a (AU)
attribute float mean_motion;    // mean motion, n (rad/s)
attribute float mean_anomaly_0; // mean anomaly at epoch time, M_0 (rad)
attribute float eccentricity;   // eccentricity, e
attribute vec3 orbital_plane;   // vector of (Ω, ω, i) (rad)

varying float vAlpha;

// Solve Kepler's equation for eccentric anomaly with a simple iterative scheme.
float KeplersEquation(float mean_anomaly, float eccentricity) {
  float eccentric_anomaly;
  if (mean_anomaly > PI) {
    eccentric_anomaly = (mean_anomaly - eccentricity) / 2.0;
  } else {
    eccentric_anomaly = (mean_anomaly + eccentric_anomaly) / 2.0;
  }

  float delta = 99.0;
  for (int i = 0; i < 20; i++) {
    delta = ((eccentric_anomaly - eccentricity * sin(eccentric_anomaly)) -
             mean_anomaly) /
            (1.0 - eccentricity * cos(eccentric_anomaly));
    eccentric_anomaly -= delta;
    if (abs(delta) < 1.0e-4) {
      break;
    }
  }
  return eccentric_anomaly;
}

// Rotate 2D cartesian elliptic coordinates into the 3D heliocentric coodinates.
//
// There are definitely more efficient ways to implement this 3D rotation, but
// until I know how to use them efficiently, we're going with this.
vec3 EllipticToHeliocentricCoordinates(vec3 p, vec2 xy) {
  // p.x = longitude of ascending node
  // p.y = argument of periapsis
  // p.z = inclination
  float q00 = -sin(p.x) * cos(p.z) * sin(p.y) + cos(p.x) * cos(p.y);
  float q01 = -sin(p.x) * cos(p.z) * cos(p.y) - cos(p.x) * sin(p.y);
  float q10 = cos(p.x) * cos(p.z) * sin(p.y) + sin(p.x) * cos(p.y);
  float q11 = cos(p.x) * cos(p.z) * cos(p.y) - sin(p.x) * sin(p.y);
  float q20 = sin(p.z) * sin(p.x);
  float q21 = sin(p.z) * cos(p.x);
  return vec3(q00 * xy.x + q01 * xy.y, q10 * xy.x + q11 * xy.y,
              q20 * xy.x + q21 * xy.y);
}

// Calculate 2D cartesian elliptic coordinates for an ellipse.
vec2 EllipticPosition(float eccentric_anomaly, float eccentricity, float a) {
  float r = a * (1.0 - eccentricity * cos(eccentric_anomaly));
  float theta = 2.0 * atan(sqrt((1.0 + eccentricity) / (1.0 - eccentricity)) *
                           tan(eccentric_anomaly / 2.0));
  return vec2(r * cos(theta), r * sin(theta));
}

void main() {
  float mean_anomaly = mean_anomaly_0 + mean_motion * time;
  float eccentric_anomaly = KeplersEquation(mean_anomaly, eccentricity);
  vec2 elliptic_position = EllipticPosition(eccentric_anomaly, eccentricity, a);
  vec3 coordinates =
      EllipticToHeliocentricCoordinates(orbital_plane, elliptic_position);

  vAlpha = alpha;
  gl_PointSize = size;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(coordinates, 1.0);
}
