import { fetchBrotliAsJSON } from "../utils";

/* eslint-disable no-restricted-globals */

self.onmessage = (message) => {
  if (message.data.cmd === "init") {
    init();
  } else {
    recomputeLocations(message.data.t);
  }
};

async function init() {
  try {
    const wasmPromise = import("../components/AsteroidSet").then(
      (wasmModule) => {
        self.wasmModule = wasmModule;
      }
    );
    const payloadPromise = fetchBrotliAsJSON(
      process.env.PUBLIC_URL + "/assets/asteroids.json.br"
    );
    const results = await Promise.all([wasmPromise, payloadPromise]);
    self.asteroidSets = createAsteroidSets(results[1]);
    self.postMessage({ cmd: "initComplete", locations: getLocationBuffers() });
  } catch {
    self.postMessage({ cmd: "error" });
  }
}

function recomputeLocations(t) {
  for (const type of Object.keys(self.asteroidSets)) {
    self.asteroidSets[type].recomputeLocations(t);
  }
  self.postMessage({ cmd: "updateComplete", locations: getLocationBuffers() });
}

function createAsteroidSets(payload) {
  const t = Date.now() / 1000;
  const epoch = payload.meta.epoch;
  const asteroidSets = {};
  for (const [type, asteroids] of Object.entries(payload["asteroids"])) {
    asteroidSets[type] = new self.wasmModule.AsteroidSet(asteroids, epoch);
    asteroidSets[type].recomputeLocations(t);
  }
  return asteroidSets;
}

function getLocationBuffers() {
  const locations = {};
  for (const [type, asteroids] of Object.entries(self.asteroidSets)) {
    locations[type] = asteroids.locationsBuffer().slice(0);
  }
  return locations;
}

/* eslint-enable no-restricted-globals */
