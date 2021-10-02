/*
  Unit tests for the send-bch command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const SendTokens = require('../../../src/commands/send-tokens')
const SendTokensMock = require('../../mocks/send-tokens-mock')
const WalletCreate = require('../../../src/commands/wallet-create')
const walletCreate = new WalletCreate()

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('send-tokens', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SendTokens()
  })

  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await fs.rm(filename)
  })

  describe('#sendTokens()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await uut.sendTokens(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })
    it('should exit with error status if the wallet has no tokens.', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 10,
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        }
        // Mock methods that will be tested elsewhere.
        sandbox
          .stub(uut.walletBalances, 'getBalances')
          .resolves(SendTokensMock.getBalancesResult)

        sandbox.stub(uut.walletBalances, 'getTokenBalances').returns([])

        await uut.sendTokens(filename, flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'No tokens found on this wallet.',
          'Should throw expected error.'
        )
      }
    })
    it('should exit with error status if no tokens in the wallet matched.', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 3,
          tokenId:
            '2d860662801067828be3c4f504ce31b2a1a36c2cdbc6d92f6160920f66b0a9ee',
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        }
        // Mock methods that will be tested elsewhere.
        sandbox
          .stub(uut.walletBalances, 'getBalances')
          .resolves(SendTokensMock.getBalancesResult)

        await uut.sendTokens(filename, flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'No tokens in the wallet matched the given token ID.',
          'Should throw expected error.'
        )
      }
    })
    it('should exit with error status for insufficient token qty.', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 10,
          tokenId:
            'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        }
        // Mock methods that will be tested elsewhere.
        sandbox
          .stub(uut.walletBalances, 'getBalances')
          .resolves(SendTokensMock.getBalancesResult)

        await uut.sendTokens(filename, flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(
          err.message,
          'Insufficient funds.',
          'Should throw expected error.'
        )
      }
    })

    it('should send tokens.', async () => {
      const flags = {
        name: 'test123',
        qty: 1,
        tokenId:
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      // Mock methods that will be tested elsewhere.
      sandbox
        .stub(uut.walletBalances, 'getBalances')
        .resolves(SendTokensMock.getBalancesResult)

      const result = await uut.sendTokens(filename, flags)

      assert.isString(result)
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true .', () => {
      const flags = {
        name: 'test123',
        qty: 1,
        tokenId:
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
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
          'You must specify a quantity of tokens with the -q flag.',
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
    it('validateFlags() should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          qty: 1,
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specifcy the SLP token ID.',
          'Expected error message.'
        )
      }
    })
    it('validateFlags() should throw error if tokenId is not valid.', () => {
      try {
        const flags = {
          name: 'test123',
          qty: 1,
          sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3',
          tokenId: 'tokenId'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'TokenIdHex must be provided as a 64 character hex string.',
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

    it('should run the run() function', async () => {
      // Mock dependencies
      const flags = {
        name: 'test123',
        qty: 3.1,
        tokenId:
          'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        sendAddr: 'bitcoincash:qpufm97hppty67chexq4p53vc29mzg437vwp7huaa3'
      }
      // Mock methods that will be tested elsewhere.
      sandbox
        .stub(uut.walletBalances, 'getBalances')
        .resolves(SendTokensMock.getBalancesResult)

      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const result = await uut.run()

      assert.isString(result)
    })
  })
})
