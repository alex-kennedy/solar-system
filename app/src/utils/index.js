import decompress from "brotli/decompress";

export async function fetchBrotliAsJSON(path) {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  const decompressed = decompress(Buffer(buffer));
  return JSON.parse(new TextDecoder("utf-8").decode(decompressed));
}
