FROM node:8

RUN apt-get install tzdata

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

CMD [ "node", "loxone-ws-influx.js" ]