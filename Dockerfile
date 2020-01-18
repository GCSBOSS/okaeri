FROM 'node:13-alpine'
ENV NODE_ENV production

EXPOSE 80
# VOLUME /usr/src/app/events.log
# VOLUME /usr/src/app/conf.toml

WORKDIR /usr/src/app

RUN addgroup -g 2000 -S okaeri && \
    adduser -u 2000 -S okaeri -G okaeri && \
    chown okaeri:okaeri /usr/src/app

USER okaeri

COPY package*.json ./
RUN npm i -P
COPY . .

CMD ["node", "./bin/okaeri.js"]
