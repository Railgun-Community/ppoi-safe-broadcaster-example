#!/bin/bash
# docker build -t relayer:latest -f docker/Dockerfile .
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"
if [ -f .env ]; then
  if [ ! -f config.toml ]; then
    export $(cat .env | xargs)
    envsubst < config.toml.in > config.toml
  fi
else echo "please copy .env.example to .env and enter your config"; exit 1
fi
docker build -t nwaku:latest -f Dockerfile-nwaku .
