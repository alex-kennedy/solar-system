import { fetchBrotliAsJSON } from "../lib/brotli";

/* eslint-disable no-restricted-globals */

const ASTEROIDS_PAYLOAD = process.env.PUBLIC_URL + "/assets/asteroids.json.br";

self.onmessage = (message) => {
  if (message.data.cmd === "init") {
    init()
      .then(() => postInitComplete())
      .catch((err) => postError(err));
  }
};

async function init() {
  const results = await fetchBrotliAsJSON(ASTEROIDS_PAYLOAD);
  self.asteroidSets = initAsteroidSets(results);
}

function initAsteroidSets(payload) {
  const asteroidSets = {};
  for (const [type, rawAsteroids] of Object.entries(payload["asteroids"])) {
    const asteroids = [];
    for (const asteroid of rawAsteroids) {
      asteroids.push({
        e: asteroid[0],
        a: asteroid[1],
        i: asteroid[2],
        longAsc: asteroid[3],
        argPeri: asteroid[4],
        meanAnomaly: asteroid[5],
      });
    }
    asteroidSets[type] = { asteroids: asteroids, epoch: payload.meta.epoch };
  }
  return asteroidSets;
}

function postError(err) {
  console.log(err);
  self.postMessage({ cmd: "error" });
}

function postInitComplete() {
  self.postMessage({ cmd: "initComplete", points: self.asteroidSets });
}

/* eslint-enable no-restricted-globals */
