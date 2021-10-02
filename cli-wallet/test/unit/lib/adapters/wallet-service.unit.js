/*
  Unit tests for the wallet-service.js library.
*/

const assert = require('chai').assert
const sinon = require('sinon')
const Conf = require('conf')
const conf = new Conf()

const WalletService = require('../../../../src/lib/adapters/wallet-service')

describe('#WalletService', () => {
  let uut
  let sandbox

  beforeEach(() => {
    uut = new WalletService()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#checkServiceId', () => {
    it('should return the selected serviceId', () => {
      // Backup the original configuration setting.
      const originalService = conf.get('selectedService')

      const mockService = 'test-service'
      conf.set('selectedService', mockService)

      const result = uut.checkServiceId()
      // console.log('result: ', result)

      assert.equal(result, mockService)

      // Restore the original configuration setting.
      conf.set('selectedService', originalService)
    })

    it('should throw an error if service is not set', () => {
      // Backup the original configuration setting.
      const originalService = conf.get('selectedService')

      try {
        const mockService = ''
        conf.set('selectedService', mockService)

        uut.checkServiceId()
        // console.log('result: ', result)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Wallet service ID does not exist in config.'
        )
      }

      // Restore the original configuration setting.
      conf.set('selectedService', originalService)
    })
  })

  describe('#getBalances', () => {
    it('should throw an error if input is not an array', async () => {
      try {
        await uut.getBalances()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'addrs input to getBalance() must be an array, of up to 20 addresses.'
        )
      }
    })

    it('should return address balances', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: 'test-data' })

      const addr = ['test-address']

      const result = await uut.getBalances(addr)
      // console.log('result: ', result)

      assert.equal(result, 'test-data')
    })

    it('should throw an error if network timeout', async () => {
      try {
        // Force network timeout
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'request timed out' } })

        const addr = ['test-address']

        await uut.getBalances(addr)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'request timed out')
      }
    })
  })

  describe('#getUtxos', () => {
    it('should throw an error if input is not a string', async () => {
      try {
        await uut.getUtxos()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'getUtxos() input address must be a string.'
        )
      }
    })

    it('should return utxo data', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: 'test-data' })

      const addr = 'test-address'

      const result = await uut.getUtxos(addr)
      // console.log('result: ', result)

      assert.equal(result, 'test-data')
    })

    it('should throw an error if network timeout', async () => {
      try {
        // Force network timeout
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'request timed out' } })

        const addr = 'test-address'

        await uut.getUtxos(addr)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'request timed out')
      }
    })
  })

  describe('#sendTx', () => {
    it('should throw an error if input is not an array', async () => {
      try {
        await uut.sendTx()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'sendTx() input hex must be a string.')
      }
    })

    it('should broadcast TX and return a txid', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: 'test-data' })

      const hex = 'test-address'

      const result = await uut.sendTx(hex)
      // console.log('result: ', result)

      assert.equal(result, 'test-data')
    })

    it('should throw an error if network timeout', async () => {
      try {
        // Force network timeout
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'request timed out' } })

        const hex = 'test-address'

        await uut.sendTx(hex)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'request timed out')
      }
    })
  })
})
