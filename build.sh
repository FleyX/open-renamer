#!/bin/bash
base=$(cd "$(dirname "$0")";pwd)
cd $base
docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerFront:/opt/front node:lts-buster-slim  bash -c "cd /opt/front &&   yarn --registry https://registry.npmmirror.com && yarn build"
docker run -it --rm --name buildOpenRenamer --user ${UID} -v $base/openRenamerBackend:/opt/app node:lts-buster-slim  bash -c "cd /opt/app &&   npm config set registry https://registry.npmmirror.com && npm install -g typescript && npm install && tsc"

rm -rf openRenamerBackend/static/*
touch openRenamerBackend/static/.gitkeep
mv openRenamerFront/dist/*  openRenamerBackend/static
rm -rf openRenamerBackend/node_modules

# 单平台打包并推送
#docker build -t fleyx/open-renamer:$0 --push .
# 多平台打包并推送
docker buildx build -t fleyx/open-renamer:$1 --platform linux/amd64,linux/arm64 --push .
