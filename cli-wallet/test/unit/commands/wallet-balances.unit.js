/*
  Unit tests for the wallet-balances command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const WalletBalances = require('../../../src/commands/wallet-balances')
const BchWalletMock = require('../../mocks/msw-mock')
const WalletServiceMock = require('../../mocks/wallet-service-mock.js')
const WalletCreate = require('../../../src/commands/wallet-create')
const walletCreate = new WalletCreate()

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('wallet-balances', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletBalances()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#displayBalance', () => {
    it('should display wallet balances', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const result = uut.displayBalance(mockWallet)

      assert.equal(result, true)
    })

    it('should display verbose UTXO data when flag is set', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const flags = {
        verbose: true
      }

      const result = uut.displayBalance(mockWallet, flags)

      assert.equal(result, true)
    })

    it('should catch and throw errors', () => {
      try {
        uut.displayBalance()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#getBalances', () => {
    it('should return wallet instance with updated UTXOs', async () => {
      // Mock dependencies
      uut.walletService = new WalletServiceMock()
      uut.BchWallet = BchWalletMock

      const result = await uut.getBalances(filename)
      // console.log('result: ', result)

      assert.property(result, 'walletInfo')
      assert.property(result, 'utxos')
      assert.property(result.utxos, 'utxoStore')
    })

    // Dev Note: Because this test manipulates environment variables that effect
    // the mock data, this test should come last.
    it('should throw an error on network error', async () => {
      try {
        // Mock dependencies
        uut.walletService = new WalletServiceMock()
        uut.BchWallet = BchWalletMock
        process.env.NO_UTXO = true

        await uut.getBalances(filename)

        process.env.NO_UTXO = false

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'UTXOs failed to update. Try again.')
      }
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

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'getBalances').resolves({})
      sandbox.stub(uut, 'displayBalance').resolves({})

      const flags = {
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should handle an error without a message', async () => {
      sandbox.stub(uut, 'parse').throws({})

      const result = await uut.run()

      assert.equal(result, 0)
    })
  })

  // describe('#run()', () => {
  //   it('should run the run() function', async () => {
  //     // Mock dependencies
  //     uut.BchWallet = BchWalletMock
  //
  //     const flags = {
  //       name: 'test123'
  //     }
  //     // Mock methods that will be tested elsewhere.
  //     sandbox.stub(uut, 'parse').returns({ flags: flags })
  //
  //     const walletData = await uut.run()
  //     // console.log('walletData: ', walletData)
  //
  //     assert.property(walletData, 'mnemonic')
  //     assert.property(walletData, 'privateKey')
  //     assert.property(walletData, 'publicKey')
  //     assert.property(walletData, 'address')
  //     assert.property(walletData, 'cashAddress')
  //     assert.property(walletData, 'slpAddress')
  //     assert.property(walletData, 'legacyAddress')
  //     assert.property(walletData, 'hdPath')
  //     assert.property(walletData, 'description')
  //
  //     // Clean up.
  //     await fs.rm(filename)
  //   })
  //
  //   it('should return 0 and display error.message on empty flags', async () => {
  //     sandbox.stub(uut, 'parse').returns({ flags: {} })
  //
  //     const result = await uut.run()
  //
  //     assert.equal(result, 0)
  //   })
  //
  //   it('should handle an error without a message', async () => {
  //     sandbox.stub(uut, 'parse').throws({})
  //
  //     const result = await uut.run()
  //
  //     assert.equal(result, 0)
  //   })
  //
  //   it('should add a description when provided', async () => {
  //     // Mock dependencies
  //     uut.BchWallet = BchWalletMock
  //
  //     const flags = {
  //       name: 'test123',
  //       description: 'test'
  //     }
  //     // Mock methods that will be tested elsewhere.
  //     sandbox.stub(uut, 'parse').returns({ flags: flags })
  //
  //     const walletData = await uut.run()
  //
  //     assert.property(walletData, 'mnemonic')
  //     assert.property(walletData, 'privateKey')
  //     assert.property(walletData, 'publicKey')
  //     assert.property(walletData, 'address')
  //     assert.property(walletData, 'cashAddress')
  //     assert.property(walletData, 'slpAddress')
  //     assert.property(walletData, 'legacyAddress')
  //     assert.property(walletData, 'hdPath')
  //     assert.property(walletData, 'description')
  //
  //     // Clean up.
  //     await fs.rm(filename)
  //   })
  // })
})
