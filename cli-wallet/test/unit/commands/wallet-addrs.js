/*
  Unit tests for the wallet-balances command.
*/

'use strict'

const assert = require('chai').assert
const sinon = require('sinon')
const fs = require('fs').promises

const WalletAddrs = require('../../../src/commands/wallet-addrs')
const WalletCreate = require('../../../src/commands/wallet-create')
const walletCreate = new WalletCreate()

const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('wallet-addrs', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletAddrs()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#getAddrs', () => {
    it('should return wallet addresses', async () => {
      const result = await uut.getAddrs(filename)
      console.log('result: ', result)

      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
    })

    it('should throw an error if wallet not found', async () => {
      try {
        await uut.getAddrs('wrong path')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot find')
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
      const flags = {
        name: 'test123'
      }
      sandbox.stub(uut, 'parse').returns({ flags: flags })

      const result = await uut.run()
      // console.log('result', result)
      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
    })

    it('should handle an error without a name', async () => {
      sandbox.stub(uut, 'parse').throws({})

      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
