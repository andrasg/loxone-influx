FROM node:8

WORKDIR /usr/src/app

RUN groupadd -r nodejs && useradd -m -r -g -s /bin/bash nodejs nodejs
USER nodejs

COPY package.json .
RUN npm install

COPY . .

CMD [ "node", "loxone-ws-influx.js" ]