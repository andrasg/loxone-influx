FROM node

RUN mkdir -p /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY src/ /app/src/
COPY tsconfig.json /app/
RUN tsc -p tsconfig.json

CMD [ "npm", "start" ]
