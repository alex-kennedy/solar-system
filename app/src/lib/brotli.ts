import decompress from "brotli/decompress";
import { Buffer } from "buffer";

export async function fetchBrotliAsJSON(path: string): Promise<Object> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const buffer = await response.arrayBuffer();
  const decompressed = decompress(Buffer.from(buffer));
  return JSON.parse(new TextDecoder("utf-8").decode(decompressed));
}

export async function fetchBrotliAsArray(path: string): Promise<Uint8Array> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const buffer = await response.arrayBuffer();
  return decompress(Buffer.from(buffer));
}
