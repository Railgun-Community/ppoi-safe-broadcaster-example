# Transaction anonymizing relayer for RAILGUN

The RAILGUN relayer network runs on [Waku](https://wakunetwork.com/), a secure and decentralized messaging protocol.

## Config

Several environment variables should be set:

- `DB_ENCRYPTION_KEY` and `MNEMONIC` secure your shielded RAILGUN wallet and should be set through `docker secret` rather than via environment variables
- `WAKU_RPC_URL` locates the RPC URL and port of your nim-waku node, like `http://localhost:8546`

## Run RAILGUN relayer

- just use npm/yarn
- `npm install`
- `npm start` or
- `npm run debug` (DEBUG mode)

## Use docker

- Prereqs: Install docker and gnupg
- Initialize docker swarm if you don't already have one: `docker swarm init`
- Generate `DB_ENCRYPTION_KEY` docker secret: `gpg --gen-random --armor 1 14 | docker secret create DB_ENCRYPTION_KEY -`
- `echo "mnemonic mnemonic..." | docker secret create MNEMONIC -`
- Build docker image: `docker/build.sh`
- Run image independently: `docker/run.sh`
- OR create service: `docker/create.sh`
- Generate waku `nodekey`: `docker/rand32.sh | docker secret create nodekey -`
- Pull nim-waku image: `docker pull statusteam/nim-waku:deploy-v2-test`

## Run tests

- `npm run test`
- npm run test-coverage` (with code coverage visualizer)
