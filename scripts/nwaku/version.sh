#!/bin/sh
curl -X GET "http://localhost:8546/debug/v1/version" -H "accept: text/plain"
curl -X GET "http://localhost:8547/debug/v1/version" -H "accept: text/plain"

