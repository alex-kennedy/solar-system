import decompress from "brotli/decompress";

export async function fetchBrotliAsJSON(path: string) {
  const response = await fetch(path);
  const buffer = await response.arrayBuffer();
  const decompressed = decompress(Buffer.from(buffer));
  return JSON.parse(new TextDecoder("utf-8").decode(decompressed));
}
