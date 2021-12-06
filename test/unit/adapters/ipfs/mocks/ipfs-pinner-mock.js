/*
  Mocks for the ipfs-pinner library
*/

class IPFSPinner {
  constructor() {
    this.pins = [];
  }

  async isReady() {
    return true;
  }

  async start() {
    return true;
  }
}

module.exports = IPFSPinner;
