FROM node:16
WORKDIR /app

ENV NODE_ENV=production
ENV REDIS_URL=
ENV RABBIT_URL=

ENV MYSQL_HOST=
ENV MYSQL_PORT=3306
ENV MYSQL_DATABASE=regenbogenice
ENV MYSQL_USER=regenbogenice
ENV MYSQL_PASSWORD=

COPY ./package.json .
COPY ./yarn.lock .

RUN yarn install --pure-lockfile

COPY ./src ./src
COPY ./migrations ./migrations
COPY ./knexfile.js .
COPY ./docker_start.sh .
RUN chmod a+x docker_start.sh

RUN yarn run build

CMD ["/app/docker_start.sh"]