import { memory } from "../wasm/index_bg.wasm";
import * as wasm from "../wasm/index";

wasm.debug_init();

class AsteroidSet {
  internal: wasm.AsteroidSet;
  locationsComputed: boolean = false;

  constructor(internal: wasm.AsteroidSet) {
    this.internal = internal;
  }

  static withCapacity(capacity: number) {
    return new AsteroidSet(wasm.AsteroidSet.with_capacity(capacity));
  }

  setEpoch(epoch: number) {
    this.internal.set_epoch(epoch);
  }

  recomputeLocations(t: number) {
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
