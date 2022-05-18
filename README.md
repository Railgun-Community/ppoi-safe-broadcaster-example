[![Node.js CI Actions Status](https://github.com/Railgun-Community/relayer/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Railgun-Community/relayer/actions)

# Transaction anonymizing relayer for RAILGUN

The RAILGUN relayer network runs on [Waku](https://wakunetwork.com/), a secure and decentralized messaging protocol.

## Prerequisites

- node 16+
- docker, if using docker
- jq (cli utility for parsing json)

## Configuration

Customize your relayer by running `npm run copy-my-config`, which copies `src/MY-CONFIG.example.ts` to `src/MY-CONFIG.ts`.
You can specify most defaults with configDefaults, and import configTokens to modify token configuration per network.

- `configDefaults.waku.rpcURL` - defaults to http://localhost:8546
- `configDefaults.networks.active = [3];` - only run on ropsten (network id 3)

## Run RAILGUN relayer

- `npm run copy-my-config`, run in root
- Make config changes to src/MY-CONFIG.ts
- `npm install`
- `npm start` or
- `npm run debug` (DEBUG mode, with logs)

## Use docker

- Prereqs: Install docker
- Create a secret key (`NODEKEY`) for your node. This is not currently used for encryption, but does establish your node's identity: `docker/nodekey.sh`
- Know your external IP (`EXTIP`) and verify that ports 60000 and 8000 are exposed to the outside world (see https://www.canyouseeme.org/ or similar).
- If you have a stable ip and domain and would like to join the community fleet of bootstrap nodes, you will need to generate an SSL certificate with letsencrypt (@todo expand later)

### regular docker

- copy `docker/.env.empty` to `docker/.env` and fill in `EXTIP` and `NODEKEY` (see above)

- build image, copying your .env file:

      docker build -f docker/Dockerfile-nwaku -t nwaku docker

- run image:

      docker run -p 8546:8546 -p 60000:60000 -p 8000:8000 -it nwaku

- verify that you can communicate with your nwaku instance over json-rpc:

      scripts/nwaku/whoami.sh

- verify that nwaku is connected to other nwaku nodes:

      scripts/nwaku/peers.sh

### docker stack (@todo)

- Initialize docker swarm if you don't already have one:

      docker swarm init

- Generate `DB_ENCRYPTION_KEY` docker secret:

      docker/nodekey.sh | docker secret create DB_ENCRYPTION_KEY -

- Generate `nodekey` docker secret:

      docker/nodekey.sh | docker secret create nodekey -

- Register `MNEMONIC` docker secret:

      echo "my mnemonic words..." | docker secret create MNEMONIC -

- Build relayer and nwaku docker images:

      docker/build.sh

- Deploy stack:

      docker/deploy.sh

- Stop stack:

      docker/stop.sh

## Run tests

- `npm run test`
- `npm run test-coverage` (with code coverage visualizer)
