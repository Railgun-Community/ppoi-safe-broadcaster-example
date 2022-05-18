#!/bin/sh
# docker build -t relayer:latest -f docker/Dockerfile .
if [ -f docker/.env ]; then
  echo "found config, good job"
  export $(cat docker/.env | xargs)
  envsubst < docker/config.toml.in > docker/config.toml
else echo "please copy .env.example to .env and enter your config"; exit 1
fi
docker build -t nwaku:latest -f docker/Dockerfile-nwaku docker
