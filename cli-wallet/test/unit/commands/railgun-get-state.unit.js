/*
  Unit tests for the railgun-get-state command.
*/

// Public npm packages.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const GetState = require('../../../src/commands/railgun-get-state')
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-get-state', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new GetState()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#getState', () => {
    it('should submit hex to Relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.relayerService, 'getState').resolves({ message: "I'm a little teapot!" })

      const flags = {
        txid: 'test'
      }

      const result = await uut.getState(flags)
      // console.log('result: ', result);

      assert.include(result, "I'm a little teapot!")
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Mock dependencies
        sandbox.stub(uut.relayerService, 'getState').rejects(new Error('test error'))

        const flags = {
          txid: 'test'
        }

        await uut.getState(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#run', () => {
    it('should catch an error and return 0', async () => {
      // sandbox.stub(uut, 'submitTx').rejects(new Error('test error'));

      const result = await uut.run()

      assert.equal(result, 0)
    })

    it('should display data about the relayer node', async () => {
      sandbox.stub(uut, 'parse').returns({ flags: { txid: 'test' } })
      sandbox.stub(uut, 'getState').resolves(mockData.message)

      await uut.run()

      assert.isOk(true)
    })
  })
})

// Simulates the response from a Relayer node.
const mockData = {
  success: true,
  status: 200,
  message: "I'm a little teapot!",
  endpoint: 'getState'
}
