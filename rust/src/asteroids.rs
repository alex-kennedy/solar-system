use wasm_bindgen::prelude::*;

/// Tolerance for solving Kepler's equation
const KEPLER_TOLERANCE: f32 = 1e-4;

/// Mass of the sun in kilograms
const MASS_SUN: f32 = 1.98847e30;

/// Universal gravitational constant in SI units
const GRAVITATIONAL_CONSTANT: f32 = 6.6743015e-11;

/// Astronomical unit in metres
const ASTRONOMICAL_UNIT: f32 = 1.495978707e11;

/// Calculates eccentric anomaly by solving Kepler's equation.
pub fn solve_keplers_equation(mean_anomaly: f32, eccentricity: f32) -> f32 {
  // Sensible initialisation of the eccentric anomaly
  let mut eccentric_anomaly: f32;
  if mean_anomaly > std::f32::consts::PI {
    eccentric_anomaly = mean_anomaly - eccentricity / 2.0;
  } else {
    eccentric_anomaly = mean_anomaly + eccentricity / 2.0;
  }

  let mut delta: f32 = std::f32::INFINITY;
  let mut iteration_count = 0;
  while delta.abs() > KEPLER_TOLERANCE && iteration_count <= 100 {
    delta = (eccentric_anomaly - eccentricity * eccentric_anomaly.sin() - mean_anomaly)
      / (1.0 - eccentricity * eccentric_anomaly.cos());
    eccentric_anomaly -= delta;
    iteration_count += 1;
  }
  eccentric_anomaly
}

/// Calculates mean motion about the sun in radians per second.
#[inline]
fn calculate_mean_motion(a: f32) -> f32 {
  (GRAVITATIONAL_CONSTANT * MASS_SUN / ((a * ASTRONOMICAL_UNIT).powi(3))).sqrt()
}

pub struct Vector3 {
  pub x: f32,
  pub y: f32,
  pub z: f32,
}

impl Vector3 {
  fn new() -> Vector3 {
    return Vector3 {
      x: 0.0,
      y: 0.0,
      z: 0.0,
    };
  }
}

pub struct Asteroid {
  pub e: f32,
  pub a: f32,
  pub i: f32,
  pub long_asc: f32,
  pub arg_peri: f32,
  pub mean_anomaly: f32,
}

impl Asteroid {
  /// Calculates position of an asteroid in its own orbital plane.
  fn calculate_elliptic_position(&self, eccentric_anomaly: f32) -> (f32, f32) {
    let radius = self.a * (1.0 - self.e * eccentric_anomaly.cos());
    let theta =
      2.0 * (((1.0 + self.e) / (1.0 - self.e)).sqrt() * (eccentric_anomaly / 2.0).tan()).atan();
    (radius * theta.cos(), radius * theta.sin())
  }
}

pub struct AsteroidTrig {
  pub sin_arg_peri: f32,
  pub cos_arg_peri: f32,
  pub sin_long_asc: f32,
  pub cos_long_asc: f32,
  pub sin_inc: f32,
  pub cos_inc: f32,
}

impl AsteroidTrig {
  /// Transforms the orbital plane (elliptic) coordinates into heliocentric coordinates
  pub fn elliptic_to_heliocentric_coordinates(&self, x: f32, y: f32) -> (f32, f32, f32) {
    let q00 =
      -self.sin_long_asc * self.cos_inc * self.sin_arg_peri + self.cos_long_asc * self.cos_arg_peri;
    let q01 =
      -self.sin_long_asc * self.cos_inc * self.cos_arg_peri - self.cos_long_asc * self.sin_arg_peri;
    let q10 =
      self.cos_long_asc * self.cos_inc * self.sin_arg_peri + self.sin_long_asc * self.cos_arg_peri;
    let q11 =
      self.cos_long_asc * self.cos_inc * self.cos_arg_peri - self.sin_long_asc * self.sin_arg_peri;
    let q20 = self.sin_inc * self.sin_arg_peri;
    let q21 = self.sin_inc * self.cos_long_asc;

    let x_dash = q00 * x + q01 * y;
    let y_dash = q10 * x + q11 * y;
    let z_dash = q20 * x + q21 * y;
    (x_dash, y_dash, z_dash)
  }
}

impl AsteroidTrig {
  fn new(a: &Asteroid) -> AsteroidTrig {
    AsteroidTrig {
      sin_arg_peri: a.arg_peri.sin(),
      cos_arg_peri: a.arg_peri.cos(),
      sin_long_asc: a.long_asc.sin(),
      cos_long_asc: a.long_asc.cos(),
      sin_inc: a.i.sin(),
      cos_inc: a.i.cos(),
    }
  }
}

#[wasm_bindgen]
pub struct AsteroidSet {
  pub epoch: f32,

  #[wasm_bindgen(skip)]
  pub asteroids: Vec<Asteroid>,

  #[wasm_bindgen(skip)]
  pub locations: Vec<Vector3>,

  #[wasm_bindgen(skip)]
  pub asteroids_trig: Vec<AsteroidTrig>,
}

#[wasm_bindgen]
impl AsteroidSet {
  pub fn new() -> AsteroidSet {
    let asteroids = vec![];
    let locations = vec![];
    let asteroids_trig = vec![];
    AsteroidSet {
      epoch: 0.0,
      asteroids,
      locations,
      asteroids_trig,
    }
  }

  pub fn with_capacity(capacity: usize) -> AsteroidSet {
    let asteroids: Vec<Asteroid> = Vec::with_capacity(capacity);
    let locations: Vec<Vector3> = Vec::with_capacity(capacity);
    let asteroids_trig: Vec<AsteroidTrig> = Vec::with_capacity(capacity);
    AsteroidSet {
      epoch: 0.0,
      asteroids,
      locations,
      asteroids_trig,
    }
  }

  pub fn set_epoch(&mut self, epoch: f32) {
    self.epoch = epoch;
  }

  pub fn push(&mut self, e: f32, a: f32, i: f32, long_asc: f32, arg_peri: f32, mean_anomaly: f32) {
    let asteroid = Asteroid {
      e,
      a,
      i,
      long_asc,
      arg_peri,
      mean_anomaly,
    };
    self.locations.push(Vector3::new());
    self.asteroids_trig.push(AsteroidTrig::new(&asteroid));
    self.asteroids.push(asteroid);
  }

  pub fn length(&self) -> usize {
    self.asteroids.len()
  }

  pub fn recompute_locations(&mut self, t: f32) {
    for (idx, ast) in self.asteroids.iter().enumerate() {
      let mean_motion = calculate_mean_motion(ast.a);
      let mean_anomaly = ast.mean_anomaly + mean_motion * (t - self.epoch);
      let eccentric_anomaly = solve_keplers_equation(mean_anomaly, ast.e);
      let (x, y) = ast.calculate_elliptic_position(eccentric_anomaly);
      let (x, y, z) = self.asteroids_trig[idx].elliptic_to_heliocentric_coordinates(x, y);
      self.locations[idx].x = x;
      self.locations[idx].y = y;
      self.locations[idx].z = z;
    }
  }

  pub fn locations_ptr(&self) -> *const Vector3 {
    self.locations.as_ptr()
  }
}
