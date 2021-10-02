/*
  Creates new wallet. Save the 12-word Mnemonic private key to a .json file.
  http://zh.thedev.id/mastering-bitcoin-cash/3-keys-addresses-wallets.html

*/

'use strict'

// Public NPM libraries
// const BCHJS = require('@psf/bch-js')
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const WalletUtil = require('../lib/wallet-util')
const WalletService = require('../lib/adapters/wallet-service')

const { Command, flags } = require('@oclif/command')

class WalletCreate extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
  }

  async run () {
    try {
      const { flags } = this.parse(WalletCreate)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      if (!flags.description) flags.description = ''

      const result = await this.createWallet(filename, flags.description)
      // console.log('result: ', result)

      return result
    } catch (err) {
      if (err.message) console.log(err.message)
      else console.log('Error in create-wallet.js/run(): ', err)

      return 0
    }
  }

  // Create a new wallet file.
  async createWallet (filename, desc) {
    try {
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      if (!desc) desc = ''

      // Configure the minimal-slp-wallet library to use the JSON RPC over IPFS.
      const walletService = new WalletService()
      const advancedConfig = {
        interface: 'json-rpc',
        jsonRpcWalletService: walletService,
        noUpdate: true
      }

      // Wait for the wallet to be created.
      this.bchWallet = new this.BchWallet(undefined, advancedConfig)
      await this.bchWallet.walletInfoPromise

      // console.log('bchWallet.walletInfo: ', this.bchWallet.walletInfo)

      // Create the initial wallet JSON object.
      const walletData = {
        wallet: this.bchWallet.walletInfo
      }
      walletData.wallet.description = desc

      // Write out the basic information into a json file for other apps to use.
      await this.walletUtil.saveWallet(filename, walletData)

      return walletData.wallet
    } catch (err) {
      if (err.code !== 'EEXIT') console.log('Error in createWallet().')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    return true
  }
}

WalletCreate.description = 'Generate a new HD Wallet.'

WalletCreate.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  description: flags.string({
    char: 'd',
    description: 'Description of the wallet'
  })
}

module.exports = WalletCreate
