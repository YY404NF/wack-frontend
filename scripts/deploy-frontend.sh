#!/usr/bin/env bash
set -eu

ARTIFACT_DIR="${1:?artifact dir is required}"
DEPLOY_PATH="${2:?deploy path is required}"

if [ -z "${DEPLOY_PATH}" ] || [ "${DEPLOY_PATH}" = "/" ]; then
  echo "refuse to deploy to an empty or root deploy path" >&2
  exit 1
fi

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

run_root mkdir -p "${DEPLOY_PATH}"
run_root find "${DEPLOY_PATH}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
run_root cp -r "${ARTIFACT_DIR}/." "${DEPLOY_PATH}/"
run_root find "${DEPLOY_PATH}" -name 'deploy-frontend.sh' -delete
