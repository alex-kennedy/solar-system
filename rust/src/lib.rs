mod utils;

use wasm_bindgen::prelude::*;

/// Tolerance for solving Kepler's equation
const KEPLER_TOLERANCE: f32 = 1e-6;

/// Mass of the sun in kilograms
const MASS_SUN: f32 = 1.98847e30;

/// Universal gravitational constant in SI units
const GRAVITATIONAL_CONSTANT: f32 = 6.6743015e-11;

/// Astronomical unit in metres
const ASTRONOMICAL_UNIT: f32 = 1.495978707e11;

#[wasm_bindgen]
pub fn debug_init() {
    utils::set_panic_hook();
}

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

    if iteration_count >= 100 {
        utils::log("Solving Kepler's equation exceeded iteration limit")
    }

    eccentric_anomaly
}

/// Calculates position of an asteroid in its own orbital plane.
pub fn calculate_elliptic_position(a: f32, e: f32, eccentric_anomaly: f32) -> (f32, f32) {
    let radius = a * (1.0 - e * eccentric_anomaly.cos());
    let theta = 2.0 * (((1.0 + e) / (1.0 - e)).sqrt() * (eccentric_anomaly / 2.0).tan()).atan();
    (radius * theta.cos(), radius * theta.sin())
}

/// Transforms the orbital plane coordinates into heliocentric coordinates
pub fn rotate_3d(x: f32, y: f32, arg_peri: f32, long_asc: f32, inc: f32) -> (f32, f32, f32) {
    let sin_arg_peri = arg_peri.sin();
    let cos_arg_peri = arg_peri.cos();
    let sin_long_asc = long_asc.sin();
    let cos_long_asc = long_asc.cos();
    let sin_inc = inc.sin();
    let cos_inc = inc.cos();

    let q00 = -sin_long_asc * cos_inc * sin_arg_peri + cos_long_asc * cos_arg_peri;
    let q01 = -sin_long_asc * cos_inc * cos_arg_peri - cos_long_asc * sin_arg_peri;
    let q10 = cos_long_asc * cos_inc * sin_arg_peri + sin_long_asc * cos_arg_peri;
    let q11 = cos_long_asc * cos_inc * cos_arg_peri - sin_long_asc * sin_arg_peri;
    let q20 = sin_inc * sin_arg_peri;
    let q21 = sin_inc * cos_long_asc;

    let x_dash = q00 * x + q01 * y;
    let y_dash = q10 * x + q11 * y;
    let z_dash = q20 * x + q21 * y;
    (x_dash, y_dash, z_dash)
}

/// Calculates mean motion about the sun in radians per second.
fn calculate_mean_motion(a: f32) -> f32 {
    (GRAVITATIONAL_CONSTANT * MASS_SUN / ((a * ASTRONOMICAL_UNIT).powi(3))).sqrt()
}

#[derive(Clone)]
pub struct Asteroid {
    e: f32,
    a: f32,
    i: f32,
    long_asc: f32,
    arg_peri: f32,
    mean_anomaly: f32,
}

#[derive(Clone)]
pub struct Vector3 {
    x: f32,
    y: f32,
    z: f32,
}

#[wasm_bindgen]
pub struct AsteroidSet {
    epoch: f32,
    asteroids: Vec<Asteroid>,
    locations: Vec<Vector3>,
}

#[wasm_bindgen]
impl AsteroidSet {
    pub fn new(count: usize, epoch: f32) -> AsteroidSet {
        let asteroid = Asteroid {
            e: 0.0,
            a: 0.0,
            i: 0.0,
            long_asc: 0.0,
            arg_peri: 0.0,
            mean_anomaly: 0.0,
        };
        let location = Vector3 {
            x: 0.0,
            y: 0.0,
            z: 0.0,
        };
        let asteroids = vec![asteroid; count];
        let locations = vec![location; count];
        AsteroidSet {
            epoch,
            asteroids,
            locations,
        }
    }

    pub fn asteroids_ptr(&self) -> *const Asteroid {
        self.asteroids.as_ptr()
    }

    pub fn locations_ptr(&self) -> *const Vector3 {
        self.locations.as_ptr()
    }

    pub fn recompute_locations(&mut self, t: f32) {
        for (idx, ast) in self.asteroids.iter().enumerate() {
            let mean_motion = calculate_mean_motion(ast.a);
            let mean_anomaly = ast.mean_anomaly + mean_motion * (t - self.epoch);
            let eccentric_anomaly = solve_keplers_equation(mean_anomaly, ast.e);
            let (x, y) = calculate_elliptic_position(ast.a, ast.e, eccentric_anomaly);
            let (x, y, z) = rotate_3d(x, y, ast.arg_peri, ast.long_asc, ast.i);
            self.locations[idx].x = x;
            self.locations[idx].y = y;
            self.locations[idx].z = z;
        }
    }
}
