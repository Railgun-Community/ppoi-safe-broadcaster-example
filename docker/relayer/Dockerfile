### install yarn and modules
FROM node:16-alpine as module-install-stage

RUN apk add git

RUN npm install -g npm

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./
RUN npm ci --ignore-scripts
COPY scripts/ ./scripts

### build app using cached modules
FROM node:16-alpine as build-stage
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
WORKDIR /app
COPY . .
RUN npm run compile

### run relayer
FROM node:16-alpine
RUN apk add bash
RUN apk add curl
RUN apk add jq
COPY --from=build-stage /app/dist/ /app/dist
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
COPY --from=module-install-stage /app/scripts/ /app/scripts
COPY --from=module-install-stage /app/package.json /app/package.json
WORKDIR /app

CMD npm run start
