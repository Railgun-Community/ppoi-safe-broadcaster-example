#!/bin/sh
docker run --name relayer --rm --env-file .env -it relayer:latest
