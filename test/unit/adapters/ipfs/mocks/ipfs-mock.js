/*
  Mocks for the js-ipfs
*/

class IPFS {
  constructor () {
    this.ipfs = {}
  }

  static create () {
    const mockIpfs = new MockIpfsInstance()

    return mockIpfs
  }

  async start () {}
}

class MockIpfsInstance {
  constructor () {
    this.config = {
      profiles: {
        apply: () => {}
      }
    }
  }

  stop () {}
}

module.exports = IPFS
