#!/bin/sh
if [ -f .env ]; then
  export $(cat .env | xargs)
fi
echo "NODEKEY: $NODEKEY"
echo "LOGLEVEL: $LOGLEVEL"
echo "DOMAIN: $DOMAIN"
echo "EXTIP: $EXTIP"

/usr/bin/wakunode \
    --log-level=$LOGLEVEL \
    --relay=true \
    --store=true \
    --rpc=true \
    --rpc-private=true \
    --rpc-admin=true \
    --rpc-address=0.0.0.0 \
    --rpc-port=8546 \
    --keep-alive=true \
    --nodekey="$NODEKEY" \
    --nat="extip:$EXTIP" \
    --staticnode=/ip4/18.117.34.173/tcp/60000/p2p/16Uiu2HAmEvDM3qLuS1fcAjwgDww9UqutSBCGX6yZEu9sVnLgUomj \
    --staticnode=/ip4/3.213.246.122/tcp/60000/p2p/16Uiu2HAmLHDo7bHwEs6k6yhWBi1fTrm4WwH48W5wGUps3gVDVFA6 \
    --staticnode=/dns4/relayer.of.holdings/tcp/60000/p2p/16Uiu2HAmMUjGmiUhJeiZgu6ZZnLRkE2VViR2JgjqtW9aTZnHQqgg \
    --staticnode=/dns4/node-01.gc-us-central1-a.status.prod.statusim.net/tcp/30303/p2p/16Uiu2HAkwBp8T6G77kQXSNMnxgaMky1JeyML5yqoTHRM8dbeCBNb \
    --staticnode=/dns4/node-01.do-ams3.status.prod.statusim.net/tcp/30303/p2p/16Uiu2HAm6HZZr7aToTvEBPpiys4UxajCTU97zj5v7RNR2gbniy1D \
