#!/bin/sh
set -e

# The origin of the server (scheme and host from API_URL, plus API_PORT when it
# is set) is added to connect-src next to 'self', so API_URL must be a plain
# websocket scheme plus a DNS name or IPv4 address, optionally followed by a
# path (for a reverse proxy that routes by path prefix). The path is not part
# of the origin and stays out of the policy. An IPv6 literal is refused: CSP
# host sources cannot express one, so the browser would ignore it and block the
# server. An empty API_PORT means no port: the client connects to API_URL as
# given and the default port of its scheme applies. Only an unset API_PORT
# falls back to 4444.
API_URL="${API_URL:-ws://localhost}"
API_PORT="${API_PORT-4444}"

fail() {
  echo "docker-entrypoint: $1" >&2
  exit 1
}

# A value with a newline would pass a line-based grep when one line matches.
case "${API_URL}${API_PORT}" in
  *"
"*) fail "API_URL and API_PORT must be single-line values" ;;
esac

printf '%s\n' "${API_URL}" | grep -Eq '^wss?://[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*(/[A-Za-z0-9._~-]+)*$' \
  || fail "API_URL must be the scheme ws or wss, then ://, then a host name or IPv4 address, optionally followed by a path without trailing slash (no port, no IPv6 literal)"

if [ -n "${API_PORT}" ]; then
  printf '%s\n' "${API_PORT}" | grep -Eq '^[1-9][0-9]{0,4}$' \
    && [ "${API_PORT}" -ge 1 ] && [ "${API_PORT}" -le 65535 ] \
    || fail "API_PORT must be empty or a number from 1 to 65535"
  CONFIG_PORT="${API_PORT}"
  API_ORIGIN_PORT=":${API_PORT}"
else
  # 0 is the "no port" value ConfigService already understands.
  CONFIG_PORT=0
  API_ORIGIN_PORT=""
fi

cat > /usr/share/nginx/html/config.json <<EOT
{
  "api_url": "${API_URL}",
  "api_port": ${CONFIG_PORT}
}
EOT

# scheme://host, without the path
API_ORIGIN="$(printf '%s' "${API_URL}" | sed -E 's|^(wss?://[^/]+).*$|\1|')${API_ORIGIN_PORT}"

sed "s|@API_ORIGIN@|${API_ORIGIN}|" \
  /etc/nginx/security-headers.conf.template > /etc/nginx/security-headers.conf

exec nginx -g "daemon off;"
