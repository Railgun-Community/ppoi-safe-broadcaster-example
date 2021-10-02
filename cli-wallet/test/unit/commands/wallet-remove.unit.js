/*
  Tests for the wallet-remove command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')

const WalletCreate = require('../../../src/commands/wallet-create')
const WalletRemove = require('../../../src/commands/wallet-remove')

// const {bitboxMock} = require('../mocks/bitbox')
// const fs = require('fs')
// const mock = require('mock-fs')

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('wallet-remove', () => {
  // let BITBOX
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletRemove()

    // By default, use the mocking library instead of live calls.
    // BITBOX = bitboxMock
    // removeWallet.BITBOX = BITBOX
    // await deleteFile()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#run', () => {
    it('should delete a wallet file', async () => {
      const flags = {
        name: 'test123'
      }

      // Mock methods that will be tested elsewhere.
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      // Create the wallet.
      const newWallet = new WalletCreate()
      await newWallet.createWallet(filename)

      // Delete the wallet.
      const result = await uut.run()
      // console.log('result: ', result)

      assert.equal(result, true)
    })
  })

  describe('#validateFlags', () => {
    it('should throw error if name flag is not included', async () => {
      try {
        await uut.validateFlags({})
      } catch (err) {
        // console.log(err)

        assert.include(
          err.message,
          'You must specify a wallet with the -n flag.',
          'Expected error message.'
        )
      }
    })
  })

  // it('run(): should run the function in mainnet', async () => {
  //   const flags = {
  //     name: 'test123',
  //   }
  //   // Mock methods that will be tested elsewhere.
  //   sandbox.stub(removeWallet, 'parse').returns({flags: flags})
  //
  //   const newWallet = new CreateWallet()
  //   await newWallet.createWallet(filename, false)
  //   const result = await removeWallet.run()
  //   assert.equal(result.code, 0)
  //   assert.equal(result.stdout, '')
  //   assert.equal(result.stderr, null)
  // })

  // it('validateFlags() should throw error if name is not supplied.', () => {
  //   try {
  //     removeWallet.validateFlags({})
  //   } catch (err) {
  //     assert.include(
  //       err.message,
  //       'You must specify a wallet with the -n flag',
  //       'Expected error message.',
  //     )
  //   }
  // })

  // it('should throw error on invalid flags (missing name)', async () => {
  //   // Mock methods that will be tested elsewhere.
  //   sandbox.stub(removeWallet, 'parse').returns({})
  //
  //   const newWallet = new CreateWallet()
  //   await newWallet.createWallet(filename, 'testnet')
  //   try {
  //     await removeWallet.run()
  //   } catch (err) {
  //     assert.include(
  //       err.message,
  //       "Cannot read property 'name' of undefined",
  //       'Expected error message.',
  //     )
  //   }
  // })

  // it('should remove wallet file', async () => {
  //   const newWallet = new CreateWallet()
  //   await newWallet.createWallet(filename, 'testnet')
  //   await removeWallet.removeWallet(filename)
  //   assert.equal(fs.existsSync(filename), false)
  // })

  // it('should throw error on shell command execution error', async () => {
  //   try {
  //     await removeWallet.removeWallet(undefined)
  //   } catch (err) {
  //     assert.include(
  //       err.message,
  //       'rm: no paths given',
  //       'Expected error message.',
  //     )
  //   }
  // })

  // it('should throw error on non-existing file', async () => {
  //   try {
  //     await removeWallet.removeWallet('non-existing')
  //   } catch (err) {
  //     assert.include(
  //       err.message,
  //       'rm: no such file or directory: non-existing',
  //       'Expected error message.',
  //     )
  //   }
  // })
})
