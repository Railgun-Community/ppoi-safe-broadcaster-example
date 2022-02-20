### install yarn and modules
FROM node:16-alpine as module-install-stage

RUN npm install -g npm@8.5.1

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm install --ignore-scripts

### build app using cached modules
FROM node:16-alpine as build-stage
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
WORKDIR /app
COPY . .
RUN npm run compile

### run relayer
FROM node:16-alpine
COPY --from=build-stage /app/dist/ /app/dist
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
WORKDIR /app

CMD node dist/main.js
