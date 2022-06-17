### install yarn and modules
FROM ubuntu:22.04 as module-install-stage

# Add Nodesource Node.JS repositories
RUN set -o pipefail && curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
# Install Node.JS 16
RUN apt install -y nodejs

# Install Git
RUN apt install -y git

# Install NPM
RUN npm install -g npm

# Setup the environment
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Install modules
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY scripts/ ./scripts

### build app using cached modules
FROM ubuntu:22.04 as build-stage
# Add Nodesource Node.JS repositories
RUN set -o pipefail && curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
# Install Node.JS 16
RUN apt install -y nodejs

COPY --from=module-install-stage /app/node_modules/ /app/node_modules
WORKDIR /app
COPY . .
RUN npm run compile

### run relayer
FROM ubuntu:22.04
# Add Nodesource Node.JS repositories
RUN set -o pipefail && curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
# Install Node.JS 16
RUN apt install -y nodejs

# Copy everything into place for the relayer
RUN apt install bash curl jq
COPY --from=build-stage /app/dist/ /app/dist
COPY --from=module-install-stage /app/node_modules/ /app/node_modules
COPY --from=module-install-stage /app/scripts/ /app/scripts
COPY --from=module-install-stage /app/package.json /app/package.json
WORKDIR /app

CMD npm run start
