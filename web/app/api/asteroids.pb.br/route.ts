// Load asteroids from the static Cloudflare bucket.
//
// This results in them being saved with the build. Once satisfied with the 
// pipeline, this can be made dynamic.

export const dynamic = "force-static";

const PATH =
  "https://solarsystem-static.alexkennedy.dev/asteroids/asteroids.pb.br";

export async function GET() {
  const response = await fetch(PATH);
  if (response.status != 200) {
    throw new Error(
      `failed to load asteroids: ${response.status}: ${response.statusText}`
    );
  }
  return new Response(await response.blob(), {
    headers: {
      "Content-Type": "application/x-protobuf",
      // Allow caching for 1d (just in case the format needs to be changed).
      "Cache-Control": "max-age=86400",
    },
  });
}
