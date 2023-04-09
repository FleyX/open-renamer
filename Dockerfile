FROM node:lts-buster-slim
WORKDIR /app
COPY ./openRenamerBackend /app
RUN chmod 777 -R /app && npm install -g pnpm typescript --registry https://registry.npmmirror.com
ENV PORT 80
CMD ["bash", "start.sh"]


