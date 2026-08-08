#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  SARALÖWE — SSL setup / expand certificate to saralowe.com       ║
# ║                                                                  ║
# ║  Run ONCE on the server (as root) after DNS for saralowe.com     ║
# ║  and www.saralowe.com points to this server's IP.                ║
# ║                                                                  ║
# ║    sudo bash scripts/ssl-setup.sh                                ║
# ║                                                                  ║
# ║  It expands the existing "saralowe.ma" certificate so a SINGLE   ║
# ║  cert covers all 4 names, then wires up automatic renewal that   ║
# ║  reloads nginx inside the Docker container.                      ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────
CERT_NAME="saralowe.ma"                 # keep the existing cert lineage
WEBROOT="/var/www/certbot"              # must match nginx.conf + docker-compose
FRONTEND_CONTAINER="academy-frontend"
EMAIL="elmehdi.houari@etu.uae.ac.ma"    # Let's Encrypt expiry notices
DOMAINS=(saralowe.ma www.saralowe.ma saralowe.com www.saralowe.com)

# Reload nginx inside the running container (certs are mounted read-only,
# nginx must be told to re-read them after a renewal).
DEPLOY_HOOK="docker exec ${FRONTEND_CONTAINER} nginx -s reload"

# ── 0. Preconditions ────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  echo "❌ Run as root:  sudo bash scripts/ssl-setup.sh"; exit 1
fi
command -v certbot >/dev/null 2>&1 || { echo "❌ certbot not installed. Run: sudo apt install certbot"; exit 1; }
command -v docker  >/dev/null 2>&1 || { echo "❌ docker not found"; exit 1; }

# Move to the repo root (parent of this script's dir) so compose finds its files.
cd "$(dirname "$0")/.."

echo "──────────────────────────────────────────────"
echo "  Domains : ${DOMAINS[*]}"
echo "  Webroot : ${WEBROOT}"
echo "  Cert    : ${CERT_NAME}"
echo "──────────────────────────────────────────────"

# ── 1. Create the shared ACME webroot on the host ───────────────
mkdir -p "${WEBROOT}/.well-known/acme-challenge"
chmod -R 755 /var/www/certbot

# ── 2. Redeploy the frontend so it has the new nginx.conf + mount ─
# (nginx.conf now serves /.well-known/acme-challenge, docker-compose now
#  mounts the webroot). Without this, the HTTP-01 challenge would 404.
echo "▶ Rebuilding frontend container with the new nginx config…"
docker compose --env-file .env.docker up -d --build frontend

# Give nginx a moment to come up.
sleep 3

# ── 2b. Sanity check: is the challenge path reachable over HTTP? ─
TEST_TOKEN="setup-check-$$"
echo "${TEST_TOKEN}" > "${WEBROOT}/.well-known/acme-challenge/${TEST_TOKEN}"
for host in saralowe.com www.saralowe.com; do
  got="$(curl -fsS --max-time 10 "http://${host}/.well-known/acme-challenge/${TEST_TOKEN}" || true)"
  if [[ "${got}" == "${TEST_TOKEN}" ]]; then
    echo "  ✅ ACME path OK for ${host}"
  else
    echo "  ⚠️  Could NOT reach http://${host}/.well-known/acme-challenge/ — check DNS A record + firewall (port 80)."
  fi
done
rm -f "${WEBROOT}/.well-known/acme-challenge/${TEST_TOKEN}"

# ── 3. Issue / expand the certificate (webroot, no downtime) ─────
# --expand + --cert-name reuses the existing lineage and just adds the new
# names, so nginx.conf keeps pointing at .../live/saralowe.ma/ .
echo "▶ Requesting certificate from Let's Encrypt…"
DOMAIN_ARGS=(); for d in "${DOMAINS[@]}"; do DOMAIN_ARGS+=(-d "$d"); done

certbot certonly \
  --webroot -w "${WEBROOT}" \
  "${DOMAIN_ARGS[@]}" \
  --cert-name "${CERT_NAME}" \
  --expand \
  --deploy-hook "${DEPLOY_HOOK}" \
  --email "${EMAIL}" \
  --agree-tos --no-eff-email \
  --non-interactive

# ── 4. Reload nginx now so it serves the new cert immediately ────
echo "▶ Reloading nginx in the container…"
docker exec "${FRONTEND_CONTAINER}" nginx -t
docker exec "${FRONTEND_CONTAINER}" nginx -s reload

# ── 5. Make sure automatic renewal is active ────────────────────
# certbot ships a systemd timer (runs twice daily). The --deploy-hook above
# is saved into the renewal config, so every future renewal reloads nginx.
if systemctl list-timers 2>/dev/null | grep -q certbot; then
  systemctl enable --now certbot.timer >/dev/null 2>&1 || true
  echo "  ✅ Auto-renewal handled by systemd certbot.timer"
else
  # Fallback: a daily cron entry (only added if it isn't there yet).
  CRON_LINE="0 3 * * * certbot renew --quiet --deploy-hook '${DEPLOY_HOOK}'"
  ( crontab -l 2>/dev/null | grep -v 'certbot renew' ; echo "${CRON_LINE}" ) | crontab -
  echo "  ✅ Auto-renewal added to root crontab (daily 03:00)"
fi

# ── 6. Show the result ──────────────────────────────────────────
echo "──────────────────────────────────────────────"
certbot certificates
echo "──────────────────────────────────────────────"
echo "✅ Done. Test a dry-run renewal any time with:"
echo "     sudo bash scripts/ssl-renew.sh --dry-run"
