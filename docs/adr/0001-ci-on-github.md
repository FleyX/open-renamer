# CI 运行在 GitHub Actions,而非代码托管的 Gitea

代码仓库托管在自建 Gitea(gitea.fleyx.com),但 CI 选择运行在 github.com/FleyX/open-renamer 的 GitHub Actions。原因是该 GitHub 仓库是开源发布渠道(README 与 Release 均指向它),且 GitHub 提供免费托管 runner,无需自建。workflow 语法两种平台兼容(Gitea Actions 兼容 GitHub Actions),未来若需迁回 Gitea 成本较低。

Status: accepted
