/*
  Unit tests for the send-bch command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const P2WDBWrite = require('../../../src/commands/p2wdb-write')
// const SendBCHMock = require('../../mocks/send-bch-mock')
const WalletCreate = require('../../../src/commands/wallet-create')
const walletCreate = new WalletCreate()
const MockWallet = require('../../mocks/msw-mock')

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('p2wdb-write', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })
  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new P2WDBWrite()
    mockWallet = new MockWallet()
  })

  afterEach(() => {
    sandbox.restore()
  })
  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true.', () => {
      const flags = {
        name: 'test123',
        data: 'a string of data',
        appId: 'test',
        centralized: true
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

    it('validateFlags() should throw error if data is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a string of data with the -d flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if appId is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          data: 'test data'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify an appId with the -a flag.',
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

    it('should return txid and hash on success', async () => {
      // mock dependencies
      sandbox.stub(uut, 'log').returns()
      mockWallet.bchjs.Util.sleep = async () => {}
      sandbox.stub(uut, 'parse').returns({ flags: {} })
      sandbox.stub(uut, 'validateFlags').returns()
      sandbox.stub(uut, 'getWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateSignature').resolves()
      sandbox.stub(uut, 'burnPsf').resolves({ success: true, txid: 'testTxid' })
      sandbox.stub(uut, 'p2wdbWrite').resolves('testHash')

      const result = await uut.run()
      // console.log('result: ', result)

      assert.property(result, 'txid')
      assert.equal(result.txid, 'testTxid')
      assert.property(result, 'hash')
      assert.equal(result.hash, 'testHash')
    })

    it('should return 0 if error burning tokens', async () => {
      // mock dependencies
      sandbox.stub(uut, 'log').returns()
      mockWallet.bchjs.Util.sleep = async () => {}
      sandbox.stub(uut, 'parse').returns({ flags: {} })
      sandbox.stub(uut, 'validateFlags').returns()
      sandbox.stub(uut, 'getWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateSignature').resolves()
      sandbox.stub(uut, 'burnPsf').resolves({ success: false })
      sandbox.stub(uut, 'p2wdbWrite').resolves('testHash')

      const result = await uut.run()
      // console.log('result: ', result)

      assert.equal(result, 0)
    })
  })

  describe('#getWallet', () => {
    it('should throw an error if filename is not included', async () => {
      try {
        await uut.getWallet()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'filename required.')
      }
    })

    it('should return the wallet object', async () => {
      // Mock dependencies
      sandbox.stub(uut.walletBalances, 'getBalances').resolves({ foo: 'bar' })

      const result = await uut.getWallet('filename')

      assert.equal(result.foo, 'bar')
    })

    it('should catch and throw errors', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.walletBalances, 'getBalances')
          .rejects(new Error('test error'))

        await uut.getWallet('filename')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#generateSignature', () => {
    it('should return a signature', async () => {
      const flags = {
        data: 'test message'
      }

      const result = await uut.generateSignature(mockWallet, flags)
      // console.log('result: ', result)

      assert.equal(
        result,
        'IMNqJ77kjX9evHlcZM8yE88jmVew6ofX2Zfow57qPnzWKF0Jr41L4VnrBfPS2imY80kwjhQkB2xNhftMR4e8A/k='
      )
    })

    it('should catch and throw errors', async () => {
      try {
        const flags = {
          data: 'test message'
        }

        // Force an error
        sandbox
          .stub(mockWallet.bchjs.BitcoinCash, 'signMessageWithPrivKey')
          .throws(new Error('test error'))

        await uut.generateSignature(mockWallet, flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#burnPsf', () => {
    it('should burn PSF tokens and return the txid', async () => {
      // Mock dependencies
      mockWallet.burnTokens = async () => {
        return { success: true, txid: 'txid' }
      }

      const result = await uut.burnPsf(mockWallet)
      // console.log('result: ', result)

      assert.equal(result.success, true)
      assert.equal(result.txid, 'txid')
    })

    it('should throw error if no PSF tokens are found', async () => {
      try {
        // Mock dependencies
        mockWallet.burnTokens = async () => {
          return { success: true, txid: 'txid' }
        }

        // Remove the PSF token from the mock data.
        mockWallet.utxos.utxoStore.slpUtxos.type1.tokens.pop()

        await uut.burnPsf(mockWallet)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Token UTXO of with ID of')
      }
    })

    it('should catch and throw an error', async () => {
      try {
        await uut.burnPsf()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#p2wdbWrite', () => {
    it('should write data using centralized service', async () => {
      // Mock test data
      const txid = 'fakeTxid'
      const signature = 'fakeSig'
      const flags = {
        appId: 'fakeAppId',
        data: 'a message',
        centralize: true
      }

      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: { hash: 'fakeHash' } })

      const result = await uut.p2wdbWrite(txid, signature, flags)
      // console.log('result: ', result)

      assert.equal(result, 'fakeHash')
    })

    it('should write data using decentralized service', async () => {
      // Mock test data
      const txid = 'fakeTxid'
      const signature = 'fakeSig'
      const flags = {
        appId: 'fakeAppId',
        data: 'a message',
        centralize: false
      }

      // Mock dependencies
      sandbox.stub(uut.p2wdbService, 'writeEntry').resolves('fakeHash')

      const result = await uut.p2wdbWrite(txid, signature, flags)
      // console.log('result: ', result)

      assert.equal(result, 'fakeHash')
    })

    it('should catch and throw an error', async () => {
      try {
        await uut.p2wdbWrite()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read property')
      }
    })
  })
})
