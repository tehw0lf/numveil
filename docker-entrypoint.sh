#!/bin/sh
set -e

# The configured origin (API_URL:API_PORT) is added to connect-src next to
# 'self', so API_URL must be a plain ws:// or wss:// host without path.
API_URL="${API_URL:-ws://localhost}"
API_PORT="${API_PORT:-4444}"

fail() {
  echo "docker-entrypoint: $1" >&2
  exit 1
}

# A value with a newline would pass a line-based grep when one line matches.
case "${API_URL}${API_PORT}" in
  *"
"*) fail "API_URL and API_PORT must be single-line values" ;;
esac

printf '%s\n' "${API_URL}" | grep -Eq '^wss?://([A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])$' \
  || fail "API_URL must be ws:// or wss:// followed by a host only (no path, no trailing slash)"

printf '%s\n' "${API_PORT}" | grep -Eq '^[1-9][0-9]{0,4}$' \
  && [ "${API_PORT}" -ge 1 ] && [ "${API_PORT}" -le 65535 ] \
  || fail "API_PORT must be a number from 1 to 65535"

cat > /usr/share/nginx/html/config.json <<EOT
{
  "api_url": "${API_URL}",
  "api_port": ${API_PORT}
}
EOT

sed "s|@API_ORIGIN@|${API_URL}:${API_PORT}|" \
  /etc/nginx/security-headers.conf.template > /etc/nginx/security-headers.conf

exec nginx -g "daemon off;"
