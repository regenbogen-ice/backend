FROM node:16-alpine as base
WORKDIR /app

COPY package.json yarn.lock ./

FROM base as dependencies

RUN yarn install --cache-folder ./ycache --immutable --immutable-cache --production=false
RUN rm -rf ./yache

FROM dependencies as build

ENV NODE_ENV=production
COPY src ./src
COPY knexfile.js tsconfig.json ./
RUN yarn run build


FROM node:16-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV REDIS_URL=
ENV RABBIT_URL=

ENV MYSQL_HOST=
ENV MYSQL_PORT=3306
ENV MYSQL_DATABASE=regenbogenice
ENV MYSQL_USER=regenbogenice
ENV MYSQL_PASSWORD=

ENV METRIC_HTTP_HOST=0.0.0.0
ENV METRIC_HTTP_PORT=9000

COPY --from=build /app/node_modules/ ./node_modules/
COPY --from=build /app/dist/ ./dist/
COPY --from=build /app/knexfile.js .
COPY --from=build /app/package.json ./
COPY ./docker_start.sh .
COPY ./migrations/ ./migrations
RUN chmod a+x docker_start.sh

EXPOSE 80
CMD ["/app/docker_start.sh"]