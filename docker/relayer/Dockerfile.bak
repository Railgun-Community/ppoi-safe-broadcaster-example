FROM ubuntu:22.04 as base
RUN apt update && apt install -y curl

# Add Nodesource Node.JS repositories
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -

# Install Node.JS 16
RUN apt install -y nodejs git jq netcat

### install modules
FROM base as module-install-stage

# Setup the environment
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Install modules
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY scripts/ ./scripts

### build app using cached modules
FROM base as build-stage

COPY --from=module-install-stage /app/node_modules/ /app/node_modules
WORKDIR /app
COPY . .
RUN npm run compile

### run relayer
FROM base

# Copy everything into place for the relayer
COPY --from=build-stage /app/dist/ /app/dist
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
COPY --from=module-install-stage /app/scripts/ /app/scripts
COPY --from=module-install-stage /app/package.json /app/package.json
WORKDIR /app

CMD npm run start
