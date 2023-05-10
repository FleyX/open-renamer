#!/bin/bash
base=$(cd "$(dirname "$0")";pwd)
cd $base
rm -rf openRenamerBackend/dist
# 注意此处未添加npm代理
# docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerFront:/opt/front node:lts-slim  bash -c "cd /opt/front &&   npm install -g pnpm --registry https://registry.npmmirror.com && pnpm install --registry https://registry.npmmirror.com && pnpm run build"
docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerFront:/opt/front node:lts-slim  bash -c "cd /opt/front &&   npm install -g pnpm  && pnpm install  && pnpm run build"

rm -rf openRenamerBackend/static/*
touch openRenamerBackend/static/.gitkeep
mv openRenamerFront/dist/*  openRenamerBackend/static
rm -rf openRenamerBackend/node_modules

# 单平台打包并推送
#docker build -t fleyx/open-renamer:$0 --push .
# 多平台打包并推送
docker buildx build -t fleyx/open-renamer:$1 --platform linux/amd64,linux/arm64 --push .
docker buildx build -t fleyx/open-renamer:latest --platform linux/amd64,linux/arm64 --push .
