// Simple web worker to offload loading and parsing the asteroids message.
//
// It should be sent a single message (of arbitrary content) and returns the
// asteroid proto message.

import { fetchBrotliAsArray } from "@/lib/brotli";
import { Asteroids } from "@/lib/proto/asteroids";

const ASTEROIDS_PATH = self.location.origin + "/assets/asteroids.pb.br";

self.onmessage = async () => {
  const results = await fetchBrotliAsArray(ASTEROIDS_PATH);
  const asteroids = Asteroids.decode(results);
  self.postMessage(asteroids);
};
