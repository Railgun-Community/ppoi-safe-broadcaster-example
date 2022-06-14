#!/bin/bash

# set cwd to docker/
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"

# create empty custom.yml if it doesn't exist
if [ ! -f custom.yml ]; then
  echo "version: '3.9'" > custom.yml
fi

if [ -f .env ]; then
  if [ ! -f docker-stack.yml ]; then
    export $(cat .env | xargs)
    envsubst < docker-stack.yml.in > docker-stack.yml
  fi
else echo "please copy .env.example to .env and enter your config"; exit 1
fi

mkdir -p appdata/swag

docker build -t relayer:latest -f relayer/Dockerfile ..
docker build --pull -t nwaku:latest -f nwaku/Dockerfile nwaku
echo "generated docker-stack.yml from .env and docker-stack.yml.in"
