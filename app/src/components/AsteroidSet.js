import { memory } from "../wasm/index_bg.wasm";
import * as wasm from "../wasm/index";

wasm.debug_init();

class AsteroidSet {
  constructor(asteroidOrbits, epoch) {
    this.count = asteroidOrbits.length;
    this.asteroidSet = wasm.AsteroidSet.new(asteroidOrbits.length, epoch);
    const orbitsBuffer = this.orbitsBuffer();
    for (let i = 0; i < asteroidOrbits.length; i++) {
      const asteroid = asteroidOrbits[i];
      for (let orbitalElement = 0; orbitalElement < 6; orbitalElement++) {
        orbitsBuffer[i * 6 + orbitalElement] = asteroid[orbitalElement];
      }
    }
    this.locationsComputed = false;
  }

  recomputeLocations(t) {
    this.asteroidSet.recompute_locations(t);
    this.locationsComputed = true;
  }

  orbitsBuffer() {
    return new Float32Array(
      memory.buffer,
      this.asteroidSet.asteroids_ptr(),
      this.count * 6
    );
  }

  locationsBuffer() {
    if (this.locationsComputed === false) {
      console.warn("Locations have not been computed!")
    }
    const buffer = new Float32Array(
      memory.buffer,
      this.asteroidSet.locations_ptr(),
      this.count * 3
    );
    return buffer;
  }
}

export { AsteroidSet };
