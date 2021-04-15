FROM node:14.15.0-alpine

WORKDIR  /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3434

CMD ["npm","start"]