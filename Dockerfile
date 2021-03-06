FROM ubuntu:18.04

RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY package*.json ./

RUN apt update
RUN apt install -y git cmake gcc build-essential nodejs npm curl
RUN npm i -g n
RUN n latest
RUN npm install -g npm@3
RUN npm i -g node-gyp
RUN npm i -g yarn
RUN npm install --save bcrypt-nodejs && npm uninstall --save bcrypt
RUN npm install
COPY . .

CMD [ "npm", "run", "celo-dev" ]

EXPOSE 3000
