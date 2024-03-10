#!/usr/bin/env node
import { restPOSTRequest } from './restRequest.js';

const { log } = console;
const args = process.argv.slice(2);
const result = await restPOSTRequest('/admin/v1/peers', [args]);
log({ result });
