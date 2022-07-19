FROM node:lts-buster-slim
WORKDIR /app
COPY ./openRenamerBackend /app
RUN chmod 777 -R /app
ENV PORT 80
CMD ["bash", "start.sh"]


