#!/bin/sh
curl -X GET "http://localhost:8645/debug/v1/info" -H "accept: application/json" | jq
