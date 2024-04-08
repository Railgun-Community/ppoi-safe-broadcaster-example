#!/bin/sh
curl -X GET "http://localhost:8546/admin/v1/peers" -H "accept: application/json" | jq
curl -X GET "http://localhost:8547/admin/v1/peers" -H "accept: application/json" | jq
