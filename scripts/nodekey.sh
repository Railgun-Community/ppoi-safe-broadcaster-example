#!/bin/bash
echo ""
key=$(openssl rand -hex 32)
if grep -q "NODEKEY=" docker/.env; then
  echo "NODEKEY already exists in .env."
  if [ "$1" = "--set-secret" ]; then
    echo "Setting Docker Secret for NODEKEY 0x$key"
    echo "0x$key" | docker secret create NODEKEY -
  else
    echo "Not Setting Docker Secret values, please run again with --set-secret if you havent already. Or manually set them."
  fi
else
  echo "NODEKEY=0x${key}" >> docker/.env
  echo "NODEKEY created with value: 0x${key}"
fi
echo ""
