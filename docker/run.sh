#!/bin/bash
cd -- "$( dirname -- "${BASH_SOURCE[0]}" )"
docker stack deploy -c docker-stack.yml -c custom.yml relayer
