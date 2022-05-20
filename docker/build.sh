#!/bin/bash
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"

# docker build -t relayer:latest -f docker/Dockerfile .

if [ -f .env ]; then
  if [ ! -f docker-stack.yml ]; then
    export $(cat .env | xargs)
    envsubst < docker-stack.yml.in > docker-stack.yml
  fi
else echo "please copy .env.example to .env and enter your config"; exit 1
fi
