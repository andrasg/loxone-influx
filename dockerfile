FROM node:8

RUN apk add tzdata

WORKDIR /usr/src/app

COPY package.json .
RUN npm install
RUN apt-get install tzdata
COPY . .

CMD [ "node", "loxone-ws-influx.js" ]