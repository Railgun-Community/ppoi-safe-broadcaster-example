#!/usr/bin/env node
import { rpcRequest } from './rpcRequest.js';

const args = process.argv.slice(2);
const { result, error } = await rpcRequest('post_waku_v2_admin_v1_peers', [args]);
console.log({ result, error });
