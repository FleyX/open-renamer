FROM denoland/deno:alpine
WORKDIR /app

# 先只复制 deno.json，利用 Docker 缓存层
COPY ./openRenamerBackend/deno.json /app/

# 缓存 deno.json 中定义的所有依赖
RUN deno cache --reload deno.json

# 再复制应用代码
COPY ./openRenamerBackend /app

# 配置权限
RUN chmod 777 -R /app

# 配置 Deno 环境变量
ENV PORT=80
ENV DENO_DIR=/app/.deno

# 预缓存入口文件及其依赖
RUN deno cache index.ts

CMD ["sh", "start.sh"]
