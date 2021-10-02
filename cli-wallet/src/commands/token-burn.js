/*
  Burn a quantity of SLP type-1 tokens.
*/

'use strict'

// Public NPM libraries
const BchWallet = require('minimal-slp-wallet/index')

// Local libraries
const WalletUtil = require('../lib/wallet-util')
// const WalletService = require('../lib/adapters/wallet-service')
const WalletBalances = require('./wallet-balances')

const { Command, flags } = require('@oclif/command')

class TokenBurn extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.walletBalances = new WalletBalances()
  }

  async run () {
    try {
      const { flags } = this.parse(TokenBurn)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      const result = await this.tokenBurn(filename, flags)
      // console.log('result: ', result)

      if (!result.success) {
        console.log('Error burning tokens: ', result)
        return 0
      }

      const txid = result.txid

      console.log(`TXID: ${txid}`)
      console.log('\nView this transaction on a block explorer:')
      console.log(`https://explorer.bitcoin.com/bch/tx/${txid}`)

      return txid
    } catch (err) {
      console.log('Error in token-burn.js/run(): ', err)

      return 0
    }
  }

  // Burn a quantity of tokens.
  async tokenBurn (filename, flags) {
    try {
      // Input validation
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      const walletData = await this.walletBalances.getBalances(filename)
      // console.log('walletData: ', walletData)

      const txid = await walletData.burnTokens(
        parseFloat(flags.qty),
        flags.tokenId
      )

      return txid
    } catch (err) {
      console.error('Error in tokenBurn()')
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

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a token Id with the -t flag.')
    }

    return true
  }
}

TokenBurn.description = 'Burn a specific quantity of SLP tokens.'

TokenBurn.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  qty: flags.string({ char: 'q', description: 'Quantity of tokens to burn' }),
  tokenId: flags.string({ char: 't', description: 'tokenId of token to burn' })
}

module.exports = TokenBurn
