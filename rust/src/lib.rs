mod utils;

use js_sys;
use wasm_bindgen::prelude::*;

/// Tolerance for solving Kepler's equation
const KEPLER_TOLERANCE: f32 = 1e-6;

/// Mass of the sun in kilograms
const MASS_SUN: f32 = 1.98847e30;

/// Universal gravitational constant in SI units
const GRAVITATIONAL_CONSTANT: f32 = 6.6743015e-11;

/// Astronomical unit in metres
const ASTRONOMICAL_UNIT: f32 = 1.495978707e11;

/// Calculates eccentric anomaly by solving Kepler's equation.
#[wasm_bindgen]
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
        utils::log("bad kepler!")
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

/// Calculates position of an asteroid at a time t in heliocentric coordinates.
///
/// # Arguments
///
/// * `t` -- Time at which to calculate position (Unix seconds)
/// * `epoch` -- Epoch time of the mean anomaly (Unix seconds)
/// * `e` -- Orbital eccentricity
/// * `a` -- Semi-major axis of the orbit (AU)
/// * `i` -- Orbital inclinations (rad)
/// * `long_asc` -- Longitude of the ascending node (rad)
/// * `arg_peri` -- Argument of perihelion (rad)
/// * `mean_anomaly` -- Mean anomaly at the epoch (rad)
///
/// # Returns
///
/// A length 3 js_sys::Float32Array containing the heliocentric cartesian
/// coordinates x, y, z
#[wasm_bindgen]
pub fn get_asteroid_position(
    t: f32,
    epoch: f32,
    e: f32,
    a: f32,
    i: f32,
    long_asc: f32,
    arg_peri: f32,
    mean_anomaly: f32,
) -> js_sys::Float32Array {
    let mean_motion = calculate_mean_motion(a);
    let mean_anomaly = mean_anomaly + mean_motion * (t - epoch);
    let eccentric_anomaly = solve_keplers_equation(mean_anomaly, e);
    let (x, y) = calculate_elliptic_position(a, e, eccentric_anomaly);
    let (x, y, z) = rotate_3d(x, y, arg_peri, long_asc, i);
    let result = js_sys::Float32Array::new_with_length(3);
    result.set_index(0, x);
    result.set_index(1, y);
    result.set_index(2, z);
    result
}
