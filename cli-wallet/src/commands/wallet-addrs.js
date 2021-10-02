/*
  List the addresses for the selected wallet
*/

'use strict'

const shelljs = require('shelljs')
// const Table = require('cli-table')

const { Command, flags } = require('@oclif/command')

class WalletAddrs extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.shelljs = shelljs
  }

  async run () {
    try {
      const { flags } = this.parse(WalletAddrs)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      return this.getAddrs(filename)
    } catch (err) {
      console.log(err)
      return 0
    }
  }

  getAddrs (filename) {
    try {
      // Load the wallet file.
      const walletJSON = require(filename)
      const walletData = walletJSON.wallet
      // console.log('walletData: ', walletData)

      console.log(' ')
      console.log(`Cash Address: ${walletData.cashAddress}`)
      console.log(`SLP Address: ${walletData.slpAddress}`)
      console.log(`Legacy Address: ${walletData.legacyAddress}`)
      console.log(' ')
      return walletData
    } catch (err) {
      console.error('Error in getAddrs()')
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

WalletAddrs.description = 'List the different addresses for a wallet.'

WalletAddrs.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' })
}

module.exports = WalletAddrs
