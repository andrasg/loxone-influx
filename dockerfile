FROM node

ENV TZ 'Europe/Budapest'

RUN cp /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY src/**/*.ts /app/src/
RUN npm run tsc

COPY dist/**/*.js /app/

CMD [ "node", "/app/loxone-ws-influx.js" ]