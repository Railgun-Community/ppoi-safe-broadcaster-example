[![Node.js CI Actions Status](https://github.com/Railgun-Community/relayer/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Railgun-Community/relayer/actions)

# Transaction anonymizing relayer for RAILGUN

The RAILGUN relayer network runs on [Waku](https://wakunetwork.com/), a secure and decentralized messaging protocol.

`relayer` is a node application which relays transactions for RAILGUN users so that their transactions are signed by your address rather than their own. Your relayer will broadcast fees on the tokens you configure it to accept at the rates you define. Messages are sent over the waku peer to peer network.

## Prerequisites

- node 16+
- docker, if using docker
- jq (cli utility for parsing json)

## Configuration

### nwaku

Create and edit docker/.env to define your environment. Start by copying docker/.env.empty to docker/.env, as this includes the needed fields.

      cp docker/.env.empty docker/.env

The fields to configure are described below. Note that you may leave the domain and email fields empty if not using a domain name.

- `EXTIP` - this is the IP address at which your system can be reached by the rest of the world
- `LISTENIP` - if your system has its own public ip, this is the same as `EXTIP`. If you are running behind a router with NAT, this may be '0.0.0.0'
- `BASEDOMAIN` - If your full domain were 'relayer.railgun.org, this would be 'railgun.org'
- `SUBDOMAIN` - If your domain were `relayer.railgun.org', this would be 'relayer'
- `TZ` - timezone code; eg 'EST'
- `EMAIL` - letsencrypt will generate an SSL certificate for your domain; an email address must be entered. Whether you enter a real email address or a fake one is up to you

### relayer

Customize your relayer by running `npm run copy-my-config`, which copies `src/MY-CONFIG.ts.example` to `src/MY-CONFIG.ts`.
You can specify most defaults with configDefaults, and import configTokens to modify token configuration per network.

- `configDefaults.networks.active = [3];` - network IDs you want to relay fees for. A value of `[1, 3, 56, 137]` would run on ethereum, binance smart chain, and polygon
- `configDefaults.waku.rpcURL` - defaults to http://localhost:8546

## Run RAILGUN relayer

- `npm run copy-my-config`, run in root
- Make config changes to src/MY-CONFIG.ts
- `npm install`
- `npm start` or
- `npm run debug` (DEBUG mode, with logs)

## Use docker

- Prereqs: Install docker
- Create a secret key (`NODEKEY`) for your node. This is not currently used for encryption, but does establish your node's identity: `scripts/nodekey.sh`
- Know your external IP (`EXTIP`) and verify that ports 60000 and 8000 are exposed to the outside world (see https://www.canyouseeme.org/ or similar).
- If you have a stable ip and domain and would like to join the community fleet of bootstrap nodes, be sure to enter your `BASEDOMAIN` and optionally `SUBDOMAIN`. The `swag` service will automatically generate an SSL certificate for you through letsencrypt.

### docker stack

- Initialize docker swarm if you don't already have one:

      docker swarm init

- Generate `DB_ENCRYPTION_KEY` docker secret:

      scripts/nodekey.sh | docker secret create DB_ENCRYPTION_KEY -
      echo "CHANGE_ME" -n | sha256sum | awk '{print $1}' | docker secret create DB_ENCRYPTION_KEY -

- Generate `nodekey` docker secret:

      scripts/nodekey.sh | docker secret create NODEKEY -

- Register `MNEMONIC` docker secret:

      echo "my mnemonic words..." | docker secret create MNEMONIC -

- Run docker/build.sh to build the `relayer` and `nwaku` docker images from your `docker/.env` environment definition

      docker/build.sh

- Deploy stack:

        docker/run.sh

        Creating network relayer_relayer
        Creating service relayer_relayer
        Creating service relayer_swag
        Creating service relayer_nwaku

You should see output like:

If you get an error about the `relayer_relayer` network not existing, just execute `docker/run.sh` again until it works.

- Stop stack:

      docker/stop.sh

- View logs. append with `-f` to follow

      docker service logs relayer_relayer       # relayer logs
      docker service logs relayer_nwaku         # nwaku network node
      docker service logs relayer_swag          # letsencrypt generation

### regular docker

- copy `docker/.env.empty` to `docker/.env` and fill in `EXTIP`, `NODEKEY`, `LISTENIP` (see above)

- build image and config.toml from your .env file:

      docker/build.sh

- run image interactively (useful for first setup):

      docker run -p 8546:8546 -p 60000:60000 -p 8000:8000 -it nwaku

- run image in background/detached:

      docker run -p 8546:8546 -p 60000:60000 -p 8000:8000 -d nwaku

- verify that you can communicate with your nwaku instance over json-rpc:

      scripts/nwaku/whoami.sh

- verify that nwaku is connected to other nwaku nodes:

      scripts/nwaku/peers.sh

## Run tests

- `npm run test`
- `npm run test-coverage` (with code coverage visualizer)
