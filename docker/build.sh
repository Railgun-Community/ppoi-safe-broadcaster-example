#!/bin/bash

# set cwd to docker/
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"

USE_SWAGLESS=""

if [ "$1" = "--no-swag" ]; then
  USE_SWAGLESS='-swagless'
fi

SETUP_STACK=docker-stack$USE_SWAGLESS.yml

# create empty custom.yml if it doesn't exist
if [ ! -f custom.yml ]; then
  echo "version: '3.9'" > custom.yml
fi

if [ -f .env ]; then
  if [ ! -f $SETUP_STACK ]; then
    export $(cat .env | xargs)
    envsubst < $SETUP_STACK.in > $SETUP_STACK
    echo "generated $SETUP_STACK from .env and $SETUP_STACK.in"
  fi
else echo "please copy .env.example to .env and enter your config"; exit 1
fi

if [ "$1" = "" ]; then
  mkdir -p appdata/swag
fi

# build broadcaster and exit 1 if it failed
docker build -t broadcaster:latest -f broadcaster/Dockerfile ..
if [ $? != 0 ]; then
  echo "FAILED TO BUILD RELAYER IMAGE"
  exit 1
fi

# build nwaku and exit 1 if it failed
docker build --pull -t nwaku:latest -f nwaku/Dockerfile nwaku
if [ $? != 0 ]; then
  echo "FAILED TO BUILD RELAYER IMAGE"
  exit 1
fi

echo "SUCCESS building broadcaster and nwaku images"
