FROM node:8

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

RUN groupadd -r nodejs && useradd -m -r -g nodejs nodejs
USER nodejs

CMD [ "node", "loxone-ws-influx.js" ]