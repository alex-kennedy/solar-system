import { fetchBrotliAsJSON } from "../lib/brotli";

/* eslint-disable no-restricted-globals */

const ASTEROIDS_PAYLOAD = process.env.PUBLIC_URL + "/assets/asteroids.json.br";

self.onmessage = (message) => {
  if (message.data.cmd === "init") {
    init().catch((err) => postError(err));
  }
};

async function init() {
  const importPromise = import("../components/AsteroidSet").then(
    (component) => {
      self.AsteroidSet = component.AsteroidSet;
    }
  );
  const payloadPromise = fetchBrotliAsJSON(ASTEROIDS_PAYLOAD);
  const results = await Promise.all([importPromise, payloadPromise]).catch(
    postError
  );
  self.asteroidSets = initAsteroidSets(results[1]);
  postInitComplete();
}

function initAsteroidSets(payload) {
  const t = Date.now() / 1000;
  const asteroidSets = {};
  for (const [type, asteroids] of Object.entries(payload["asteroids"])) {
    const asteroidSet = self.AsteroidSet.withCapacity(asteroids.length);
    asteroidSet.setEpoch(payload.meta.epoch);
    for (const asteroid of asteroids) {
      asteroidSet.internal.push(
        asteroid[0],
        asteroid[1],
        asteroid[2],
        asteroid[3],
        asteroid[4],
        asteroid[5]
      );
    }
    asteroidSet.recomputeLocations(t);
    asteroidSets[type] = asteroidSet;
  }
  return asteroidSets;
}

function getLocations() {
  const locations = {};
  for (const [type, asteroids] of Object.entries(self.asteroidSets)) {
    locations[type] = asteroids.locations().slice(0);
  }
  return locations;
}

function postError(err) {
  console.log(err);
  self.postMessage({ cmd: "error" });
}

function postInitComplete() {
  self.postMessage({ cmd: "initComplete", locations: getLocations() });
}

/* eslint-enable no-restricted-globals */
