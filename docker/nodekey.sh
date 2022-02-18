#!/bin/sh
tr -dc 'a-f0-9' < /dev/urandom | dd bs=1 count=64 2>/dev/null | xargs printf "0x%s"
