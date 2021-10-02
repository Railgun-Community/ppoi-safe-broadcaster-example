/*
  Unit tests for the wallet-create command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const WalletCreate = require('../../../src/commands/wallet-create')
const BchWalletMock = require('../../mocks/msw-mock')

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('wallet-create', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletCreate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#createWallet()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await uut.createWallet(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })

    // it('Should exit with error status if called with a filename that already exists.', async () => {
    //   try {
    //     // Force the error for testing purposes.
    //     sandbox.stub(uut.fs, 'existsSync').returns(true)
    //
    //     await uut.createWallet(filename, 'testnet')
    //
    //     assert.fail('Unexpected result')
    //   } catch (err) {
    //     assert.equal(
    //       err.message,
    //       'filename already exist',
    //       'Should throw expected error.',
    //     )
    //   }
    // })

    it('should create a mainnet wallet file with the given name', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const walletData = await uut.createWallet(filename)
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(uut.validateFlags({ name: 'test' }), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run()', () => {
    it('should run the run() function', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const walletData = await uut.run()
      // console.log('walletData: ', walletData)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })

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

    it('should add a description when provided', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123',
        description: 'test'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const walletData = await uut.run()

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })
  })
})
