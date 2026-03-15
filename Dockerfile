FROM denoland/deno:alpine
WORKDIR /app
COPY ./openRenamerBackend /app

# 配置权限
RUN chmod 777 -R /app

# 配置 Deno 环境变量
ENV PORT=80
ENV DENO_DIR=/app/.deno

# 预缓存依赖
RUN deno cache index.ts

CMD ["bash", "start.sh"]
