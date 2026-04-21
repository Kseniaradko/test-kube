#!/bin/sh
set -eu

CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"

escape_for_sed() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

APP_TITLE_VALUE="${APP_TITLE:-React Kubernetes Demo}"
APP_ENV_VALUE="${APP_ENV:-production}"
APP_BANNER_VALUE="${APP_BANNER:-Deployed from container image}"
APP_VERSION_VALUE="${APP_VERSION:-latest}"
APP_HIGHLIGHT_LABEL_VALUE="${APP_HIGHLIGHT_LABEL:-Release ready}"

sed -i \
  -e "s/__APP_TITLE__/$(escape_for_sed "$APP_TITLE_VALUE")/g" \
  -e "s/__APP_ENV__/$(escape_for_sed "$APP_ENV_VALUE")/g" \
  -e "s/__APP_BANNER__/$(escape_for_sed "$APP_BANNER_VALUE")/g" \
  -e "s/__APP_VERSION__/$(escape_for_sed "$APP_VERSION_VALUE")/g" \
  -e "s/__APP_HIGHLIGHT_LABEL__/$(escape_for_sed "$APP_HIGHLIGHT_LABEL_VALUE")/g" \
  "$CONFIG_FILE"
