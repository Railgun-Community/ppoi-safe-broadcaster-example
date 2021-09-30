/*
  Top level file for starting the Relayer daemon.

  Code is broken up into four categories as per Clean Architecture design pattern:
  - Entities - primary concepts
  -
*/

// Local libraries.
const Adapters = require("./src/adapters");
const Controllers = require("./src/controllers");

class Relayer {
  constructor() {
    // Encapsulate dependencies
    this.adapters = new Adapters();
    this.controllers = new Controllers();
  }

  async startRelayer() {
    try {
      console.log("Starting Relays Daemon...");

      // Load the adapter libraries and wait for any required asynchronous
      // initialization to complete. e.g. spin up the IPFS node.
      await this.adapters.start();

      this.controllers.helloWorld();

      return true;
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = Relayer;
