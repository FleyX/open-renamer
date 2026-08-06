# open-renamer

文件批量重命名工具(BS 架构,后端 Deno + 前端 Vue),支持 docker 部署与桌面客户端两种使用方式。

## CI / 发布

**test 分支**:
预发布验证分支。任何 push(含 PR 合并)到该分支,触发一次预发布构建,产出 `test` 镜像。

**Release**:
GitHub 上的发布物,与 git tag 一一对应,承载 5 个平台的客户端压缩包。
_Avoid_: 版本、发版

**客户端压缩包**:
面向 mac-arm / mac-x64 / win-x64 / linux-arm / linux-x64 的独立可执行文件 zip,用户下载解压即用。
_Avoid_: 安装包、dmg/exe 安装程序
