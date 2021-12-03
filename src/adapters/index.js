/*
  Top-level Adapters library. This aggregates the other adapter libraries
  and presents a single Class library for all controllers. This is in-line with
  the Clean Architecture design pattern:
  https://troutsblog.com/blog/clean-architecture
*/

// Local libraries
const IPFSAdapter = require("./ipfs");

class Adapters {
  constructor() {
    // Encapsulate dependencies
    this.ipfs = new IPFSAdapter();
  }

  // This function is used to start any asynchronous functions that need to be
  // waited on to initialize any of the adapter libraries.
  async start() {
    try {
      // Start the IPFS node.
      await this.ipfs.start();

      return true;
    } catch (err) {
      console.error("Error in start() of main Adapters library.");
      throw err;
    }
  }
}

module.exports = Adapters;
