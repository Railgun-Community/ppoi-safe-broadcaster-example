#!/bin/sh
docker build -t relayer:latest -f docker/Dockerfile .
docker build -t wakunode:latest -f docker/Dockerfile-waku docker
