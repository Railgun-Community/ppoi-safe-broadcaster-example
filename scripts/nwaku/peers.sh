#!/bin/sh
curl -d '{ "jsonrpc":"2.0", "method":"get_waku_v2_admin_v1_peers", "params":[], "id":1 }' -H 'Content-Type: application/json' -X POST localhost:8546/ -s | jq .result
