# open-renamer

![预览图](https://s3.fleyx.com/picbed/2022/11/18386180128d01eb1a59b8eacf652895.png)

renamer 的开源实现版本，BS 应用，支持全平台部署使用

- 服务器部署，支持 docker,已打包镜像到 dockerhub 中:[hub.docker.com](https://hub.docker.com/r/fleyx/open-renamer),可直接使用。
- 客户端直接启动，github release 页中下载对应平台客户端(mac,linux,windows)，[点击去下载](https://github.com/FleyX/open-renamer/releases)
  renamer 的开源实现版本，BS 应用，两种使用方式支持全平台部署使用

开源地址:[github.com/FleyX/open-renamer](https://github.com/FleyX/open-renamer)

已实现如下处理规则 ：

- 插入(支持季号识别,支持后缀过滤)
- 删除(支持正则)
- 替换(支持正则)
- 序列化
- 自动识别(针对 nas 用户开发，自动获取季号，剧名/电影名)
- 简繁转换(支持港澳繁体，台湾繁体)

特点：

- 不限制规则数量
- 支持将规则保存为模板，方便下次使用
- 全平台(arm,x86)支持，可直接部署在 nas 中，通过浏览器访问;也可直接下载客户端应用本地启动
- 针对 nas 视频文件有特殊优化,智能识别剧集名称，季号，集数，方便 jellyfin、emby 等软件识别

## 客户端安装

跳转[github.com/FleyX/open-renamer/releases/latest](https://github.com/FleyX/open-renamer/releases/latest) 下载对应平台的 zip 压缩包，解压后执行

## docker 部署

**非必须，建议直接下载可执行文件本地运行**

### 首次部署

推荐通过 docker 部署到 nas 中，即可管理 nas 媒体文件

#### docker 部署

```bash
# 管理/mnt/vdisk目录中的文件，通过8089端口访问服务
docker run -itd  --name openRenamer -v /mnt/vdisk:/data -p 8089:8089 -e PORT="8089" -e TOKEN="123456" fleyx/open-renamer:latest
```

- docker-compose 运行：

```yaml
version: "3.6"
  openRenamer:
    container_name: openRenamer
    image: fleyx/open-renamer:latest
    # 当前用户的uid,gid，使用root可不配置此项
    #user: "1000:1000"
    environment:
      # 指定启动端口
      - PORT=11004
      # 指定认证token，不设置此项无需认证
      - TOKEN=123456
    volumes:
      # 关键，把想要管理的文件夹映射到容器的data目录中，即可在程序中选择data目录进行重命名操作
      - /mnt/vdisk:/data
      # 存储模板数据，可不映射此目录
      - ./data/openRenamer:/app/data
    # 使用宿主机网络.即可通过"宿主机ip:11004"访问程序
    network_mode: host
```

#### 代码部署

1. 安装最新的 node 环境
2. 下载代码
3. 编译前后端
4. 将前端打包后 dist 目录下所有的文件复制到后端的 static 目录下

### 升级

1. 如果使用 latest 版本，通过`docker pull fleyx/open-renamer:latest`命令更新镜像
2. 如果使用版本号，直接修改 docker 版本号为最新的版本号,重新运行即可

## TODO

## 版本更新记录


### 1.9.1

客户端应用优化，去除启动脚本，直接双击应用启动

### 1.9.0

新增 windows,linux,mac 客户端,根据各自平台选择对应客户端

- **linux x64**: renamer-linux-x64-desktop.zip
- **linux arm64**: renamer-linux-arm-desktop.zip
- **windows x64**: renamer-win-x64-desktop.zip
- **mac arm**: renamer-mac-arm-desktop.zip
- **mac intel**: renamer-mac-x64-desktop.zip

### 1.8.0

- 删除、替换规则支持正则表达式
- 修复删除规则的一些问题

### 1.7.1

- 新增简繁转换规则 [issue 38](https://github.com/FleyX/open-renamer/issues/38)
- 全选支持文件夹 [issue 39](https://github.com/FleyX/open-renamer/issues/39)
- 客户端打开增加 loading 效果

### 1.7

- 通过 electron 技术支持桌面端，目前已支持 windows

### 1.6.2

- 修复文件数量过多时报错 bug [#35](https://github.com/FleyX/open-renamer/issues/35)

### 1.6.1

- 文本过长显示 bug [#34](https://github.com/FleyX/open-renamer/issues/34)
  ![修复文本过长显示](https://s3.fleyx.com/picbed/2023/05/4374cc1b43bfe1c670434317baeaf389.png)

### 1.6

- 新增替换规则 [#33](https://github.com/FleyX/open-renamer/issues/33)

  ![替换规则](https://s3.fleyx.com/picbed/2023/05/f94d2a2579f728a5ff478f046ca4786e.png)

- 修复一些 bug

### 1.5

- 修复模板保存 bug[#31](https://github.com/FleyX/open-renamer/issues/31)
- 季识别优化，支持中文(一,二,三。。。十),最大支持九十九 [#29](https://github.com/FleyX/open-renamer/issues/29)
- 序列化规则支持根据后缀分组[#30](https://github.com/FleyX/open-renamer/issues/30)

### 1.4

- 季识别优化，增加 season.01,文本 01 类型支持

### 1.3

- 添加文件支持勾选文件夹，以添加文件夹下所有内容
  ![1](https://s3.fleyx.com/picbed/2023/03/bc3ee7aadf8fd2f3bfc1381b92b4bd89.png)
- 支持文件列表下直接重命名、删除文件
  ![1](https://s3.fleyx.com/picbed/2023/03/24f29ad19885c3b8cff93be2b2f6e508.png)
  ![1](https://s3.fleyx.com/picbed/2023/03/0fe66150fc15b34e7005c74e3604eb48.png)
- 支持一键选中非视频、字幕、nfo 文件,方便清理
- 添加剧集重命名参考模板

**注意本次更新后将会通过接口获取用户使用情况(不会获取任何隐私数据)**
