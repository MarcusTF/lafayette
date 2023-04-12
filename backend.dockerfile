FROM node:latest
ARG PORT=5432
EXPOSE $PORT:$PORT
WORKDIR /
COPY server/package.json .
RUN npm i
COPY ./server .

CMD [ "npm", "run", "deploy" ]
