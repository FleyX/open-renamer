#!/bin/bash
set -e
base=$(cd "$(dirname "$0")" && pwd)
cd "$base"
docker run --rm --name buildOpenRenamer -v "$base/openRenamerFront:/opt/front" -w /opt/front node:24.22.3-slim \
  bash -c "npm install -g pnpm@10.18.3 --registry https://registry.npmmirror.com && pnpm install --frozen-lockfile --registry https://registry.npmmirror.com && pnpm run build && chmod a+rwX -R dist"

rm -rf openRenamerBackend/static/*
touch openRenamerBackend/static/.gitkeep
mv openRenamerFront/dist/*  openRenamerBackend/static

if [ -z "${1:-}" ]; then
  # 单平台打包并推送
  echo "local test,version:dev"
  docker build -t fleyx/open-renamer:dev .
else
  echo "prod build & push docker.io"
  docker buildx build -t "fleyx/open-renamer:$1" -t fleyx/open-renamer:latest --platform linux/amd64,linux/arm64 --push .
fi
