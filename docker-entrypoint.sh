#!/bin/sh
set -e

API_URL="${API_URL:-ws://localhost}"
API_PORT="${API_PORT:-4444}"

cat > /usr/share/nginx/html/config.json <<EOF
{
  "api_url": "${API_URL}",
  "api_port": ${API_PORT}
}
EOF

exec nginx -g "daemon off;"
