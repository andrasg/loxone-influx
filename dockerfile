FROM node

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY src/ /app/src/
COPY tsconfig.json /app/
RUN npm run tsc

COPY dist/ /app/

CMD [ "node", "/app/loxone-ws-influx.js" ]