FROM node

ENV TZ 'Europe/Budapest'

RUN cp /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install
RUN npm tsc

COPY . /app

CMD [ "node", "/app/dist/loxone-ws-influx.js" ]