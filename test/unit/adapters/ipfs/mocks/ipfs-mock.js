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
    this.pin = {
      addAll: (source) => { return source.map((i) => ({ cid: i })) }
    }
  }


  stop () {}
}

module.exports = IPFS
