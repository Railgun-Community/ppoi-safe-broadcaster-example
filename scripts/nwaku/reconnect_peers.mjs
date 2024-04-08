#!/usr/bin/env node
import { restGETRequest, restPOSTRequest } from './restRequest.js';

const { log } = console;

const reconnect = async (peer) => {
  const res = await restPOSTRequest('/admin/v1/peers', [[peer]]);
  log(peer, res);
};

const result = await restGETRequest('/admin/v1/peers');

result
  .filter((peer) => peer.connected === false)
  .forEach((peer) => reconnect(peer));
