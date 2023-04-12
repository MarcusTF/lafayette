FROM node:latest
WORKDIR /
COPY server/package.json .
RUN npm i
COPY ./server .

CMD [ "npm", "run", "deploy" ]
