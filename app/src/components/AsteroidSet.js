import { memory } from "../wasm/index_bg.wasm";
import * as wasm from "../wasm/index";

wasm.debug_init();

class AsteroidSet {
  constructor(internal) {
    this.internal = internal;
    this.locationsComputed = false;
  }

  static withCapacity(capacity) {
    return new AsteroidSet(wasm.AsteroidSet.with_capacity(capacity));
  }

  setEpoch(epoch) {
    this.internal.set_epoch(epoch);
  }

  recomputeLocations(t) {
    this.internal.recompute_locations(t);
    this.locationsComputed = true;
  }

  locations() {
    if (this.locationsComputed === false) {
      console.warn("Locations have not been computed!");
    }
    const buffer = new Float32Array(
      memory.buffer,
      this.internal.locations_ptr(),
      this.internal.length() * 3
    );
    return buffer;
  }
}

export { AsteroidSet };
