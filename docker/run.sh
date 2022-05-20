#!/bin/sh
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"
docker stack deploy -c docker-stack.yml relayer
