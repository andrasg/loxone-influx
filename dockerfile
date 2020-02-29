FROM node

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY src/**/*.ts /app/src/
RUN npm run tsc

COPY dist/**/*.js /app/

CMD [ "node", "/app/loxone-ws-influx.js" ]