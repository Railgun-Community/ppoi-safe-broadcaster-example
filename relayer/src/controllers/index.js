/*
  Top-level Controllers library. This aggregates the other controller libraries
  and presents a single Class library for all controllers. This is in-line with
  the Clean Architecture design pattern:
  https://troutsblog.com/blog/clean-architecture
*/

// Local libraries
const JSONRPC = require("./json-rpc");

class Controllers {
  constructor(localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters;
    if (!this.adapters) {
      throw new Error(
        "Instance of Adapters library required when instantiating Controllers."
      );
    }

    // Encapsulate dependencies
    this.jsonRpc = new JSONRPC(localConfig);
  }

  helloWorld() {
    return this.jsonRpc.helloWorld();
  }
}

module.exports = Controllers;
