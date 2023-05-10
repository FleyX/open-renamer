FROM node:lts-buster-slim
WORKDIR /app
COPY ./openRenamerBackend /app
# RUN chmod 777 -R /app && npm install -g pnpm typescript --registry https://registry.npmmirror.com
# 注意此处未添加npm代理
RUN chmod 777 -R /app && npm install -g pnpm typescript 
ENV PORT 80
CMD ["bash", "start.sh"]


