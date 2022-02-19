# Transaction anonymizing relayer for RAILGUN

The RAILGUN relayer network runs on [Waku](https://wakunetwork.com/), a secure and decentralized messaging protocol.

## Configuration

Customize your relayer by copying `src/MY-CONFIG.example.ts` to `src/MY_CONFIG.ts`. You should specify the networks you want to run on, @todo etc

- `configDefaults.waku.rpcURL` - defaults to http://localhost:8546
- `configDefaults.networks.active = [3];` - only run on ropsten (network id 3)

## Run RAILGUN relayer

- just use npm/yarn
- `npm install`
- `npm start` or
- `npm run debug` (DEBUG mode)

## Use docker

- Prereqs: Install docker
- Initialize docker swarm if you don't already have one: `docker swarm init`
- Generate `DB_ENCRYPTION_KEY` docker secret: `docker/nodekey.sh | docker secret create DB_ENCRYPTION_KEY -`
- Generate `nodekey` docker secret: `docker/nodekey.sh | docker secret create nodekey -`
- Register `MNEMONIC` docker secret: `echo "my mnemonic words..." | docker secret create MNEMONIC -`
- Build `relayer` and `waku` docker images: `docker/build.sh`
- Deploy stack: `docker/deploy.sh`
- Stop stack: `docker/stop.sh`

## Run tests

- `npm run test`
- `npm run test-coverage` (with code coverage visualizer)
