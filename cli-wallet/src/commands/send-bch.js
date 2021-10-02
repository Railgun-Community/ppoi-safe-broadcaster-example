/*
  Sends a quantity of BCH.
*/

'use strict'

// Public NPM libraries
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const WalletUtil = require('../lib/wallet-util')
// const WalletService = require('../lib/adapters/wallet-service')
const WalletBalances = require('./wallet-balances')

const { Command, flags } = require('@oclif/command')

class SendBch extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.walletBalances = new WalletBalances()
  }

  async run () {
    try {
      const { flags } = this.parse(SendBch)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      const result = await this.sendBch(filename, flags)
      // console.log('result: ', result)

      if (!result.success) {
        console.log('Error sending BCH: ', result)
        return 0
      }

      const txid = result.txid

      console.log(`TXID: ${txid}`)
      console.log('\nView this transaction on a block explorer:')
      console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)

      return txid
    } catch (err) {
      console.log('Error in send-bch.js/run(): ', err)

      return 0
    }
  }

  // Send BCH from the wallet implied by filename, and with the settings saved
  // in the flags object.
  async sendBch (filename, flags) {
    try {
      // Input validation
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      const walletData = await this.walletBalances.getBalances(filename)

      if (walletData.bchBalance < flags.qty) {
        throw new Error(
          `Insufficient funds. You are trying to send ${flags.qty} BCH, but the wallet only has ${walletData.bchBalance} BCH`
        )
      }

      const receivers = [
        {
          address: flags.sendAddr,
          amountSat: walletData.bchjs.BitcoinCash.toSatoshi(flags.qty)
        }
      ]

      const txid = await walletData.send(receivers)
      return txid
    } catch (err) {
      console.error('Error in sendBch()')
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

    const qty = flags.qty
    if (isNaN(Number(qty))) {
      throw new TypeError(
        'You must specify a quantity in BCH with the -q flag.'
      )
    }

    const sendAddr = flags.sendAddr
    if (!sendAddr || sendAddr === '') {
      throw new Error('You must specify a send-to address with the -a flag.')
    }

    return true
  }
}

SendBch.description = 'Send BCH'

SendBch.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  qty: flags.string({ char: 'q', description: 'Quantity in BCH' }),
  sendAddr: flags.string({ char: 'a', description: 'Cash address to send to' })
}

module.exports = SendBch
