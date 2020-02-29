FROM node:8

ENV TZ 'Europe/Budapest'

RUN cp /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone

WORKDIR /usr/src/app

COPY package.json .
RUN npm install

COPY . .

CMD [ "node", "loxone-ws-influx.js" ]