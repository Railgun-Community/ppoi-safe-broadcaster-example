/*
  Clean Architecture Adapter for ipfs pinner
  pins configured files in ipfs
*/

// Local libraries
const config = require("../../../config");

let _this;

class IpfsPinnerAdapter {
  constructor(localConfig = {}) {
    // Dependency injection.
    this.ipfs = localConfig.ipfs;
    if (!this.ipfs) {
      throw new Error(
        "Instance of IPFS must be passed when instantiating ipfs-pinner."
      );
    }

    // Encapsulate dependencies
    this.pins = config.pins;
    this.pinned = [];

    // Properties of this class instance.
    this.isReady = false;

    _this = this;
  }

  async start() {
    console.log('Starting IPFS Pinner');
    await this.addPins();
    // Signal that this adapter is ready.
    this.isReady = true;
    console.log('IPFS Pinner is ready');

    return this.isReady;
  }

  /**
   * return ['cid'] for each cid in config.pins{key: 'cid',}
   */
  async addPins() {
    try {
      let pins = Object.values(this.pins);
      for await (const res of this.ipfs.pin.addAll(pins, { timeout: config.pinTimeout })) {
        console.log('pinning CID: ', res.cid.toString());
        this.pinned.push(res.cid.toString());
      };

      return this.pinned;
    } catch (e) {
      console.log(e);
      throw new Error("Error pinning CIDs", e);
    }

  }
}

module.exports = IpfsPinnerAdapter;
