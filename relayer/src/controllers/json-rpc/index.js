/*
  Controller library for the JSON RPC over IPFS.
  This is a router that routes incoming RPC requrest to appropriate handler.
*/

// Public npm libraries
const jsonrpc = require("jsonrpc-lite");

// Local support libraries
const AboutController = require("./about");

class JSONRPC {
  constructor(localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters;
    if (!this.adapters) {
      throw new Error(
        "Instance of Adapters library required when instantiating JSON RPC Controllers."
      );
    }

    // Encapsulate dependencies
    this.jsonrpc = jsonrpc;
    this.aboutController = new AboutController();

    // Cache to store IDs of processed JSON RPC commands. Used to prevent
    // duplicate processing.
    this.msgCache = [];
    this.MSG_CACHE_SIZE = 30;
  }

  helloWorld() {
    console.log("hello world");
  }
}

module.exports = JSONRPC;
