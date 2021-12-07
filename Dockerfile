FROM node:lts-buster-slim
WORKDIR /app
copy ./openRenamerBackend /app
ENV PORT 80
CMD ["/usr/local/bin/node", "dist/index.js"]


