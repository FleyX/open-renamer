#!/bin/bash
base=$(cd "$(dirname "$0")";pwd)
cd $base
rm -rf openRenamerBackend/dist
# 注意此处未添加npm代理
docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerFront:/opt/front node:hydrogen-slim  bash -c "cd /opt/front &&   npm install -g pnpm --registry https://registry.npmmirror.com && pnpm install --registry https://registry.npmmirror.com && pnpm run build"

rm -rf openRenamerBackend/static/*
touch openRenamerBackend/static/.gitkeep
mv openRenamerFront/dist/*  openRenamerBackend/static
rm -rf openRenamerBackend/node_modules

if [ -z "$1" ]; then
  # 单平台打包并推送
  echo "local test,version:dev"
  docker build -t fleyx/open-renamer:dev .
else
  echo "prod build & push docker.io"
  docker buildx build -t fleyx/open-renamer:$1 --platform linux/amd64,linux/arm64 --push .
  docker buildx build -t fleyx/open-renamer:latest --platform linux/amd64,linux/arm64 --push .
fi
