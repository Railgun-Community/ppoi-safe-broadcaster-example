### base
FROM node:lts-bullseye-slim AS base
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y --no-install-recommends jq build-essential netcat python3 && rm -rf /var/lib/apt/lists/*
RUN corepack prepare yarn@1.22.19 --activate

### install
# install from lockfile; wont change unless packages have
FROM base AS buildenv
WORKDIR /app

COPY package.json ./
COPY yarn.lock ./
COPY patches ./patches
RUN corepack yarn install
RUN corepack npx patch-package

### compile
# compile typescript to /dist
FROM buildenv AS compile
WORKDIR /app

COPY src ./src
COPY ./tsconfig.json ./
COPY patches ./patches
RUN corepack npx patch-package

RUN corepack yarn tsc && corepack yarn tsc-alias

FROM compile AS build-prod
WORKDIR /app

RUN corepack yarn install
RUN corepack npx patch-package

### prod
# copy compiled source and prod dependencies and run
FROM base AS prod
WORKDIR /app

COPY --from=compile /app/dist ./dist
COPY --from=build-prod /app/node_modules ./node_modules
COPY package.json yarn.lock ./
COPY scripts ./scripts
