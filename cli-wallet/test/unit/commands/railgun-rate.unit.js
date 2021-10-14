/*
  Unit tests for the railgun-rate command.
*/

// Public npm packages.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const RailgunRate = require('../../../src/commands/railgun-rate')
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-rate', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new RailgunRate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#getRate', () => {
    it('should query the relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.relayerService, 'getRate').resolves({ message: 44 })

      const result = await uut.getRate()
      // console.log('result: ', result);

      assert.equal(result, 44)
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Mock dependencies
        sandbox.stub(uut.relayerService, 'getRate').rejects(new Error('test error'))

        await uut.getRate()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#run', () => {
    it('should catch an error and return false', async () => {
      sandbox.stub(uut, 'getRate').rejects(new Error('test error'))

      const result = await uut.run()

      assert.equal(result, 0)
    })

    it('should display data about the relayer node', async () => {
      sandbox.stub(uut, 'getRate').resolves(mockData.message)

      await uut.run()

      assert.isOk(true)
    })
  })
})

// Simulates the response from a Relayer node.
const mockData = {
  success: true,
  status: 200,
  message: 10,
  endpoint: 'rate'
}
