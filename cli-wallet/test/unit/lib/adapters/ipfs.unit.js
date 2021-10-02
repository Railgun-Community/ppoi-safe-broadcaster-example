/*
  Unit tests for the IPFS Adapter.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const IPFSLib = require('../../../../src/lib/adapters/ipfs')
const IPFSMock = require('../../../mocks/ipfs-mock')

describe('#IPFS-adapter', () => {
  let uut
  let sandbox

  beforeEach(() => {
    uut = new IPFSLib()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#start', () => {
    it('should return a promise that resolves into an instance of IPFS.', async () => {
      // Mock dependencies.
      uut.IPFS = IPFSMock

      const result = await uut.start()
      // console.log('result: ', result)

      assert.equal(uut.isReady, true)

      assert.property(result, 'config')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.IPFS, 'create').rejects(new Error('test error'))

        await uut.start()

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'test error')
      }
    })
  })
})
