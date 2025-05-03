// Load bright stars from the static Cloudflare bucket.
//
// This results in them being saved with the build, which is easier to deploy
// and perhaps better for Cloudflare-managed caching.

export const dynamic = "force-static";

const PATH = "https://static.alexkennedy.dev/brightstars/brightstars.pb.br";

export async function GET() {
  const response = await fetch(PATH);
  if (response.status != 200) {
    throw new Error(
      `failed to load bright stars: ${response.status}: ${response.statusText}`
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
