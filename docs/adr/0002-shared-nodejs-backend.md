# Electron 和 Docker 共用 Node.js 后端

Deno 原团队计划于 2027 年 10 月结束对独立运行时的维护，Open Renamer 将现有 TypeScript 后端迁到 Node.js，由 Electron 桌面客户端和 Docker/NAS 版共用。Electron 在应用窗口中加载同一套 Vue 界面，以保持两端功能一致。开发环境和 Docker 采用 Electron 正式版内置的 Node.js 24.x LTS，并共用内置的 `node:sqlite`，以减少运行时差异和跨平台原生依赖打包工作。

Status: accepted
