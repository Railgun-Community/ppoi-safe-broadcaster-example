#!/usr/bin/env node
import { rpcRequest } from './rpcRequest.js';

const { log } = console;

const reconnect = async (peer) => {
  const res = await rpcRequest('post_waku_v2_admin_v1_peers', [[peer.multiaddr]]);
  log(res);
}

const { result, error } = await rpcRequest('get_waku_v2_admin_v1_peers', []);

result
  .filter((peer) => !peer.connected)
  .forEach((peer) => reconnect(peer));
