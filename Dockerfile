FROM node:lts-buster-slim
WORKDIR /app
COPY ./openRenamerBackend /app
RUN chmod 777 -R /app && npm config set registry=https://registry.npmmirror.com && npm install -g typescript
ENV PORT 80
CMD ["bash", "start.sh"]


