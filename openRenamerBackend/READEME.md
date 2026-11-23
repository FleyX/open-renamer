# 后端

后端使用 Node.js 24.22.3 运行，桌面客户端和 Docker 镜像共用同一套 TypeScript 后端与 `node:sqlite`。

```bash
pnpm install --frozen-lockfile
pnpm start
```

开发、测试和类型检查：

```bash
pnpm dev
pnpm test
pnpm typecheck
```

Electron 客户端的开发和打包说明位于 `../openRenamerDesktop`。
