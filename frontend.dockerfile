FROM node:latest
WORKDIR /
COPY client/package.json ./
RUN npm i
COPY ./client ./

CMD [ "npm", "run", "build" ]
