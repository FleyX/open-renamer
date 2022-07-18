FROM node:lts-buster-slim
WORKDIR /app
copy ./openRenamerBackend /app
ENV PORT 80
CMD ["bash", "start.sh"]


