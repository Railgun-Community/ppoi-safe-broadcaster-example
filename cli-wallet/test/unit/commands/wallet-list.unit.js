'use strict'

const assert = require('chai').assert
const fs = require('fs').promises
const sinon = require('sinon')

const WalletCreate = require('../../../src/commands/wallet-create')

const WalletList = require('../../../src/commands/wallet-list')

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-list', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletList()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#parseWallets', () => {
    it('should correctly parse wallet data', async () => {
      // Create a mainnet wallet.
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename)

      const data = uut.parseWallets()

      // Find the wallet that was just created.
      const testWallet = data.find(wallet => wallet[0].indexOf('test123') > -1)
      // console.log('testWallet: ', testWallet)

      assert.include(testWallet[0], 'test123')

      // Clean up
      await fs.rm(filename)
    })

    it('should return empty array on missing wallets data', async () => {
      // Force shelljs.ls to return an empty array.
      sandbox.stub(uut.shelljs, 'ls').returns([])

      let data

      try {
        data = uut.parseWallets()
      } catch (error) {
        assert.equal(data, [], 'Empty array')
        assert.equal(error, 'No wallets found.', 'Proper error message')
      }
    })
  })

  describe('#run', () => {
    it('should display wallets table', async () => {
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename, 'test wallet')

      Promise.resolve(uut.run()).then(function (table) {
        assert.include(table, 'Name')
        assert.include(table, 'Balance (BCH)')
      })

      // Clean up
      await fs.rm(filename)
    })

    it('should report stack trace on error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'parseWallets').throws(new Error('test error'))

        await uut.run()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
})
