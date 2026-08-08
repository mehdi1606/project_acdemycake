#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  SARALÖWE — SSL renew (manual / cron)                            ║
# ║                                                                  ║
# ║    sudo bash scripts/ssl-renew.sh            # renew if due      ║
# ║    sudo bash scripts/ssl-renew.sh --dry-run  # test only         ║
# ║                                                                  ║
# ║  Automatic renewal is already set up by ssl-setup.sh (certbot   ║
# ║  timer / cron). This is just a convenience wrapper.             ║
# ╚══════════════════════════════════════════════════════════════════╝
set -euo pipefail

FRONTEND_CONTAINER="academy-frontend"
DEPLOY_HOOK="docker exec ${FRONTEND_CONTAINER} nginx -s reload"

if [[ $EUID -ne 0 ]]; then
  echo "❌ Run as root:  sudo bash scripts/ssl-renew.sh"; exit 1
fi

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "▶ Dry-run renewal (no changes written)…"
  certbot renew --webroot -w /var/www/certbot --dry-run
  echo "✅ Dry-run OK — real renewals will work."
else
  echo "▶ Renewing certificates if within 30 days of expiry…"
  certbot renew --deploy-hook "${DEPLOY_HOOK}"
  echo "✅ Renewal check complete."
fi
