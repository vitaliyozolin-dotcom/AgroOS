#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY_URL="https://github.com/vitaliyozolin-dotcom/AgroOS.git"
REPOSITORY_BRANCH="timeweb-production"
INSTALL_DIRECTORY="/opt/agroos"
SITE_ADDRESS="app.osagro.ru"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Запустите установку от root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git openssl ufw docker.io docker-compose-v2
systemctl enable --now docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

if [[ -d "${INSTALL_DIRECTORY}/.git" ]]; then
  git -C "${INSTALL_DIRECTORY}" fetch origin "${REPOSITORY_BRANCH}"
  git -C "${INSTALL_DIRECTORY}" checkout "${REPOSITORY_BRANCH}"
  git -C "${INSTALL_DIRECTORY}" merge --ff-only "origin/${REPOSITORY_BRANCH}"
else
  install -d -m 0755 "${INSTALL_DIRECTORY}"
  git clone --depth 1 --branch "${REPOSITORY_BRANCH}" "${REPOSITORY_URL}" "${INSTALL_DIRECTORY}"
fi

cd "${INSTALL_DIRECTORY}"

credentials_created=false
if [[ ! -f .env ]]; then
  dashboard_user="vitaliy"
  dashboard_password="$(openssl rand -base64 24 | tr -d '=+/\n' | cut -c1-22)"
  device_key="$(openssl rand -hex 32)"
  dashboard_hash="$(docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext "${dashboard_password}")"

  umask 077
  {
    printf 'AGROOS_SITE_ADDRESS=%s\n' "${SITE_ADDRESS}"
    printf 'AGROOS_DEVICE_KEY=%s\n' "${device_key}"
    printf 'AGROOS_DASHBOARD_USER=%s\n' "${dashboard_user}"
    printf "AGROOS_DASHBOARD_PASSWORD_HASH='%s'\n" "${dashboard_hash}"
  } > .env
  {
    printf 'AgroOS dashboard: https://%s\n' "${SITE_ADDRESS}"
    printf 'Dashboard user: %s\n' "${dashboard_user}"
    printf 'Dashboard password: %s\n' "${dashboard_password}"
    printf 'ESP32 device key: %s\n' "${device_key}"
  } > /root/agroos-credentials.txt
  chmod 600 .env /root/agroos-credentials.txt
  credentials_created=true
fi

docker compose up -d --build
docker compose ps

echo
echo "AgroOS установлен. DNS A-запись app.osagro.ru должна указывать на 217.25.93.75."
echo "После обновления DNS Caddy автоматически получит HTTPS-сертификат."
if [[ "${credentials_created}" == true ]]; then
  echo
  echo "Учётные данные созданы в /root/agroos-credentials.txt."
  echo "Сейчас они будут показаны один раз. Не присылайте снимок этого экрана."
  cat /root/agroos-credentials.txt
fi
