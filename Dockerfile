FROM 'node:13-alpine'
ENV NODE_ENV production

EXPOSE 7667

WORKDIR /okaeri

CMD node ./bin/okaeri.js

RUN addgroup -g 2000 -S okaeri && \
    adduser -u 2000 -S okaeri -G okaeri && \
    chown okaeri:okaeri /okaeri

USER okaeri

COPY package*.json ./
RUN npm i -P
COPY . .
