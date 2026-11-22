# syntax=docker/dockerfile:1

# 依赖与锁文件在构建平台上安装。当前生产依赖均为纯 JS，因此多架构构建时无需
# 在目标平台执行 pnpm，也不依赖宿主机注册 ARM binfmt。
FROM --platform=$BUILDPLATFORM node:24.22.3-alpine AS dependencies
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate
COPY openRenamerBackend/package.json openRenamerBackend/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
RUN mkdir -p /app/data && chmod 0777 /app/data

FROM node:24.22.3-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

COPY --from=dependencies /app/node_modules ./node_modules
COPY --chmod=0777 --from=dependencies /app/data ./data

COPY openRenamerBackend/package.json ./
COPY openRenamerBackend/index.node.ts ./
COPY openRenamerBackend/server ./server
COPY openRenamerBackend/api ./api
COPY openRenamerBackend/dao ./dao
COPY openRenamerBackend/entity ./entity
COPY openRenamerBackend/i18n ./i18n
COPY openRenamerBackend/service ./service
COPY openRenamerBackend/util ./util
COPY openRenamerBackend/sqls ./sqls
COPY openRenamerBackend/static ./static

CMD ["node", "index.node.ts"]
