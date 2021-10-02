/*
  Sends Tokens.
*/

'use strict'

// Public NPM libraries
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const WalletUtil = require('../lib/wallet-util')
// const WalletService = require('../lib/adapters/wallet-service')
const WalletBalances = require('./wallet-balances')

const { Command, flags } = require('@oclif/command')

class SendTokens extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.walletBalances = new WalletBalances()
  }

  async run () {
    try {
      const { flags } = this.parse(SendTokens)

      // Ensure flags meet qualifiying critieria.
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      const txid = await this.sendTokens(filename, flags)
      console.log('txid: ', txid)

      console.log('\nView this transaction on a block explorer:')
      console.log(`https://simpleledger.info/#tx/${txid}`)

      return txid
    } catch (err) {
      console.log('Error in send-tokens.js/run(): ', err)

      return 0
    }
  }

  async sendTokens (filename, flags) {
    try {
      // Input validation
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      const walletData = await this.walletBalances.getBalances(filename)
      const tokens = this.walletBalances.getTokenBalances(
        walletData.utxos.utxoStore.slpUtxos.type1.tokens
      )
      if (!tokens.length) {
        throw new Error('No tokens found on this wallet.')
      }
      // console.log('tokens', tokens)

      const tokenToSend = tokens.find(val => val.tokenId === flags.tokenId)
      // console.log('tokenToSend', tokenToSend)

      if (!tokenToSend) {
        throw new Error('No tokens in the wallet matched the given token ID.')
      }
      if (tokenToSend.qty < flags.qty) {
        throw new Error(
          `Insufficient funds. You are trying to send ${flags.qty}, but the wallet only has ${tokenToSend.qty}`
        )
      }

      const receiver = {
        address: flags.sendAddr,
        tokenId: tokenToSend.tokenId,
        qty: flags.qty
      }

      const result = await walletData.sendTokens(receiver, 5.0)
      // console.log('result: ', result)

      return result.txid
    } catch (err) {
      console.error('Error in sendTokens()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // console.log(`flags: ${JSON.stringify(flags, null, 2)}`)

    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet with the -n flag.')
    }

    const qty = flags.qty
    if (isNaN(Number(qty))) {
      throw new TypeError(
        'You must specify a quantity of tokens with the -q flag.'
      )
    }

    const sendAddr = flags.sendAddr
    if (!sendAddr || sendAddr === '') {
      throw new Error('You must specify a send-to address with the -a flag.')
    }

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specifcy the SLP token ID.')
    }

    // check Token Id should be hexademical chracters.
    const re = /^([A-Fa-f0-9]{2}){32,32}$/
    if (typeof tokenId !== 'string' || !re.test(tokenId)) {
      throw new Error(
        'TokenIdHex must be provided as a 64 character hex string.'
      )
    }

    return true
  }
}

SendTokens.description = 'Send Tokens'

SendTokens.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  tokenId: flags.string({ char: 't', description: 'Token ID' }),
  sendAddr: flags.string({
    char: 'a',
    description: 'Cash or SimpleLedger address to send to'
  }),
  qty: flags.string({ char: 'q', decription: 'Quantity of tokens to send' })
}
module.exports = SendTokens
