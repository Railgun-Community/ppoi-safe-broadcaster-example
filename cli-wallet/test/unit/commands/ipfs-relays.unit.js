'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

const IpfsRelays = require('../../../src/commands/ipfs-relays')
const RelaysMock = require('../../mocks/ipfs-relays-mock')

describe('#ipfs-relays', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new IpfsRelays()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#run', () => {
    it('should catch axios error and return false', async () => {
      sandbox.stub(uut.axios, 'post').throws(new Error('test error'))
      const result = await uut.run()
      assert.isFalse(result)
    })
    it('should display circuit relays and return true', async () => {
      sandbox.stub(uut.axios, 'post').resolves({ data: RelaysMock })
      const result = await uut.run()
      assert.isTrue(result)
    })
  })
})
