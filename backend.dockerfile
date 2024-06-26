FROM node:latest
ARG PORT=9238
EXPOSE $PORT:$PORT
WORKDIR /
COPY server/package.json .
RUN npm i
COPY ./server .

CMD [ "npm", "run", "deploy" ]
