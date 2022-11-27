# open-renamer

![](https://qiniupic.fleyx.com/blog/202204071632882.png)

renamer 的开源实现版本，BS 应用，支持全平台部署使用
已打包镜像到 dockerhub 中:[hub.docker.com](https://hub.docker.com/r/fleyx/open-renamer)

已实现如下三种处理规则 ：

- 插入(支持季号识别,支持后缀过滤)
- 删除
- 序列化
- 自动识别(针对 nas 用户开发，自动获取季号，剧名/电影名)

特点：

- 不限制规则数量
- 支持将规则保存为模板，方便下次使用
- 全平台(arm,x86)支持，可直接部署在 nas 中，通过浏览器访问

## 运行方式：

推荐通过 docker 部署到 nas 中，即可管理 nas 媒体文件

- docker 命令运行：

```bash
# 管理/mnt/vdisk目录中的文件，通过8089端口访问服务
docker run -itd  --name openRenamer -v /mnt/vdisk:/data -p 8089:8089 -e PORT="8089" -e TOKEN="123456" fleyx/open-renamer
```

- docker-compose 运行：

```yaml
version: "3.6"
  openRenamer:
    container_name: openRenamer
    image: fleyx/open-renamer
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
