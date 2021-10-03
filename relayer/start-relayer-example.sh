#!/bin/bash

# START optional settings

# Uncomment this line if this Railgun Relayer should also function as an
# IPFS Circuit Relay, which helps other nodes connect to one another. It
# must not have any firewalls between this node and the internet.
# export ENABLE_CIRCUIT_RELAY=1
# If this node has a domain name and SSL certificate, then it can be
# used as a Circuit Relay for web browsers. Add the domain name here:
# export CR_DOMAIN=sub.yourdomain.com

# 0 = less output. 3 = max output
export DEBUG_LEVEL=1

# END optional settings



# START required settings

# Human-readable name used to identify this node.
export COORD_NAME=generic-railgun-relay

# 12-word mnemonic. Used for end-to-end encryption.
export MNEMONIC="ginger dizzy lumber remove legend light add clinic broccoli glass myth skull"

# Configure the HTTP ports used by this node.
export PORT=5001
export IPFS_TCP_PORT=4001
export IPFS_WS_PORT=4003

# END required settings

npm start
