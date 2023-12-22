set -e

BRIGHT_STARS_OUTPUT="/solar-system/public/assets/bright_stars.pb.br"
ASTEROIDS_OUTPUT="/solar-system/public/assets/asteroids.pb.br"

# Run the asteroids pipeline
/usr/local/bin/pipeline \
  --bright_stars_output="${BRIGHT_STARS_OUTPUT}" \
  --asteroids_output="${ASTEROIDS_OUTPUT}"

# Build the site
cd /solar-system/ && \
  npm run build

# Deploy to cloudflare pages
cd /solar-system/ && \
  npx wrangler pages deploy \
  --project-name=alex-kennedy-solar-system \
  /solar-system/build
