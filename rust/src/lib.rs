mod asteroids;
mod utils;

pub use asteroids::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn debug_init() {
  utils::set_panic_hook();
}
