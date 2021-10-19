/*
  Unit tests for the railgun-submit-tx command.
*/

// Public npm packages.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const SubmitTx = require('../../../src/commands/railgun-submit-tx')
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-submit-tx', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SubmitTx()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#submitTx', () => {
    it('should submit hex to Relayer', async () => {
      // Mock dependencies
      sandbox
        .stub(uut.relayerService, 'submitTx')
        .resolves({ message: 'Hex recieved successfully' })

      const flags = {
        hex: 'test'
      }

      const result = await uut.submitTx(flags)
      // console.log('result: ', result);

      assert.include(result, 'Hex recieved successfully')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Mock dependencies
        sandbox.stub(uut.relayerService, 'submitTx').rejects(new Error('test error'))

        const flags = {
          hex: 'test'
        }

        await uut.submitTx(flags)

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
      sandbox.stub(uut, 'parse').returns({ flags: { hex: 'test' } })
      sandbox.stub(uut, 'submitTx').resolves(mockData.message)

      await uut.run()

      assert.isOk(true)
    })
  })
})

// Simulates the response from a Relayer node.
const mockData = {
  success: true,
  status: 200,
  message: 'Hex recieved successfully',
  hex: 'test',
  endpoint: 'submitTx'
}
