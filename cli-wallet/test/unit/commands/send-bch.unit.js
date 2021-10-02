/*
  Unit tests for the send-bch command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const SendBch = require('../../../src/commands/send-bch')
const SendBCHMock = require('../../mocks/send-bch-mock')
const WalletCreate = require('../../../src/commands/wallet-create')
const walletCreate = new WalletCreate()

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('send-bch', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SendBch()
  })

  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await fs.rm(filename)
  })

  describe('#sendBch()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await uut.sendBch(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })
    it('should exit with error status if bch balance is less that qty provided.', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 3,
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        }
        // Mock methods that will be tested elsewhere.
        sandbox
          .stub(uut.walletBalances, 'getBalances')
          .resolves(SendBCHMock.getBalancesResult)

        await uut.sendBch(filename, flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Insufficient funds',
          'Should throw expected error.'
        )
      }
    })

    it('should send bch.', async () => {
      const flags = {
        name: 'test123',
        qty: 1,
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      // Mock methods that will be tested elsewhere.
      sandbox
        .stub(uut.walletBalances, 'getBalances')
        .resolves(SendBCHMock.getBalancesResult)

      const result = await uut.sendBch(filename, flags)

      assert.isObject(result)
      assert.property(result, 'success')
      assert.property(result, 'status')
      assert.property(result, 'endpoint')
      assert.property(result, 'txid')
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true .', () => {
      const flags = {
        name: 'test123',
        qty: 1,
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag.',
          'Expected error message.'
        )
      }
    })
    it('validateFlags() should throw error if qty is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity in BCH with the -q flag.',
          'Expected error message.'
        )
      }
    })
    it('validateFlags() should throw error if sendAddr is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          qty: 1
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a send-to address with the -a flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run()', () => {
    it('should return 0 and display error.message on empty flags', async () => {
      sandbox.stub(uut, 'parse').returns({ flags: {} })

      const result = await uut.run()

      assert.equal(result, 0)
    })

    it('should handle an error without a message', async () => {
      sandbox.stub(uut, 'parse').throws({})

      const result = await uut.run()

      assert.equal(result, 0)
    })
    it('should return 0 , if the response return success property as false', async () => {
      // Mock dependencies
      const flags = {
        name: 'test123',
        qty: 1,
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      // Mock methods that will be tested elsewhere.
      sandbox
        .stub(uut.walletBalances, 'getBalances')
        .resolves(SendBCHMock.getBalancesResult2)

      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const result = await uut.run()

      assert.equal(result, 0)
    })
    it('should run the run() function', async () => {
      // Mock dependencies
      const flags = {
        name: 'test123',
        qty: 1,
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      // Mock methods that will be tested elsewhere.
      sandbox
        .stub(uut.walletBalances, 'getBalances')
        .resolves(SendBCHMock.getBalancesResult)

      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const result = await uut.run()

      assert.isString(result)
    })
  })
})
