/*
  Top-level Controllers library. This aggregates the other controller libraries
  and presents a single Class library for all controllers. This is in-line with
  the Clean Architecture design pattern:
  https://troutsblog.com/blog/clean-architecture
*/

// Local libraries
const JSONRPC = require('./json-rpc');

class Controllers {
  constructor(localConfig = {}) {
    this.jsonRpc = new JSONRPC();
  }

  helloWorld() {
    return this.jsonRpc.helloWorld();
  }
}

module.exports = Controllers;
