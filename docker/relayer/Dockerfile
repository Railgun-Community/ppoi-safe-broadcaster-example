### base
FROM node:18-slim as base
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y --no-install-recommends jq build-essential netcat curl python3 && rm -rf /var/lib/apt/lists/*
RUN corepack prepare pnpm@latest --activate

###
FROM base as buildenv

### fetch
# fetch packages from network for later offline use
FROM buildenv as fetch
WORKDIR /app
COPY pnpm-lock.yaml ./

RUN corepack pnpm fetch

### install
# install from lockfile; wont change unless packages have
FROM fetch as pnpmi
WORKDIR /app
COPY package.json ./
RUN corepack pnpm install --offline --frozen-lockfile

### compile
# compile typescript to /dist
FROM pnpmi as compile
WORKDIR /app
COPY src ./src
COPY ./tsconfig.json ./

RUN corepack pnpm tsc && corepack pnpm tsc-alias

FROM compile as pnpmi-prod
WORKDIR /app

RUN corepack pnpm install --prod --offline --frozen-lockfile

### prod
# copy compiled source and prod dependencies and run
FROM base as prod

WORKDIR /app

COPY --from=compile /app/dist ./dist
COPY --from=pnpmi-prod /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY scripts ./scripts

CMD corepack pnpm run start
