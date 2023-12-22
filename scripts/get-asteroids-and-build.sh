BRIGHT_STARS_OUTPUT="/solar-system/build/bright_stars.json.br"
ASTEROIDS_OUTPUT="/solar-system/build/asteroids.json.br"

# Run the asteroids pipeline
/usr/local/bin/pipeline \
  --bright_stars_output="${BRIGHT_STARS_OUTPUT}" \
  --asteroids_output="${ASTEROIDS_OUTPUT}"

# Build the site
npm run build

# Deploy to cloudflare pages
npx wrangler pages deploy \
  --project-name=alex-kennedy-solar-system \
  /solar-system/build
