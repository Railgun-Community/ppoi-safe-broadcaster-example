#!/bin/sh
curl -X GET "http://localhost:8645/admin/v1/peers" -H "accept: application/json" | jq
