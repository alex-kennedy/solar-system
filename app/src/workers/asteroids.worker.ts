import { fetchBrotliAsArray } from "../lib/brotli";
import { Asteroids } from "../lib/proto/asteroids";

const ASTEROIDS_PATH = process.env.PUBLIC_URL + "/assets/asteroids.pb.br";

let asteroids: Asteroids | null = null;

self.onmessage = (message: MessageEvent<{ cmd: string }>) => {
  if (message.data.cmd === "init") {
    init().then(postInitComplete).catch(postError);
  }
};

async function init() {
  const results = await fetchBrotliAsArray(ASTEROIDS_PATH);
  asteroids = Asteroids.decode(results);
}

function postError(err: Error) {
  console.error(err);
  self.postMessage({ cmd: "error" });
}

function postInitComplete() {
  self.postMessage({ cmd: "initComplete", asteroids });
}

export {};
