FROM node:lts-buster-slim
WORKDIR /app
copy ./openRenamerBackend /app
RUN rm /app/sqls/* && chmod 777 /app/sqls
ENV PORT 80
CMD ["/usr/local/bin/node", "dist/index.js"]


