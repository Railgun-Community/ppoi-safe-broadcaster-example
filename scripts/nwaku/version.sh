curl -d '{ "jsonrpc":"2.0", "method":"get_waku_v2_debug_v1_version", "params":[], "id":1 }' -H 'Content-Type: application/json' -X POST localhost:8546/ -s | jq .result
