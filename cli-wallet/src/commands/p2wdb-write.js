/*
  This command does the following:
  - Burns 0.01 PSF tokens and saves the TXID.
  - Writes data to the P2WDB using the TXID as proof-of-burn
*/

'use strict'

// Public NPM libraries
const BchWallet = require('minimal-slp-wallet/index')
const axios = require('axios')
const Conf = require('conf')

// Local libraries
const WalletUtil = require('../lib/wallet-util')
const WalletBalances = require('./wallet-balances')
const P2wdbService = require('../lib/adapters/p2wdb-service')

const { Command, flags } = require('@oclif/command')

const PROOF_OF_BURN_QTY = 0.01
const P2WDB_TOKEN_ID =
  '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'

// const P2WDB_SERVER = 'http://localhost:5001/entry/write'
const P2WDB_SERVER = 'https://p2wdb.fullstack.cash/entry/write'

class P2WDBWrite extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.walletBalances = new WalletBalances()
    this.conf = new Conf()
    this.p2wdbService = new P2wdbService()
    this.axios = axios
  }

  async run () {
    try {
      const { flags } = this.parse(P2WDBWrite)

      // Validate input flags
      this.validateFlags(flags)

      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      const walletData = await this.getWallet(filename)
      // console.log('walletData: ', walletData)

      const signature = await this.generateSignature(walletData, flags)
      // console.log('signature: ', signature)

      const burnResult = await this.burnPsf(walletData)

      if (!burnResult.success) {
        console.log('Error burning tokens: ', burnResult)
        return 0
      }

      const txid = burnResult.txid

      this.log(`\nProof-of-burn BCH TXID: ${txid}`)
      this.log('View this transaction on a block explorer:')
      this.log(`https://simpleledger.info/#tx/${txid}`)

      // Wait a few seconds to let TX data propegate around the BCH network.
      await walletData.bchjs.Util.sleep(3000)

      // Write data to the P2WDB.
      const hash = await this.p2wdbWrite(txid, signature, flags)

      this.log(`\nP2WDB hash for entry: ${hash}`)
      this.log(`Data URL: https://p2wdb.fullstack.cash/entry/hash/${hash}`)

      return { txid, hash }
    } catch (err) {
      console.log('Error in p2wdb-write.js/run(): ')

      return 0
    }
  }

  // Create an instance of minimal-slp-wallet populated with data from filename
  // and the blockchain.
  async getWallet (filename) {
    try {
      // Input validation
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      const walletData = await this.walletBalances.getBalances(filename)

      return walletData
    } catch (err) {
      console.error('Error in getWallet()')
      throw err
    }
  }

  // Generate a cryptographic signature, required to write to the database.
  async generateSignature (walletData, flags) {
    try {
      const privKey = walletData.walletInfo.privateKey

      // console.log('privKey: ', privKey)
      // console.log('flags.data: ', flags.data)

      const signature = walletData.bchjs.BitcoinCash.signMessageWithPrivKey(
        privKey,
        flags.data
      )

      return signature
    } catch (err) {
      console.error('Error in generateSignature()')
      throw err
    }
  }

  // Burn enough PSF to generate a valide proof-of-burn for writing to the P2WDB.
  async burnPsf (walletData) {
    try {
      // console.log('walletData: ', walletData)
      // console.log(
      //   `walletData.utxos.utxoStore.slpUtxos: ${JSON.stringify(
      //     walletData.utxos.utxoStore.slpUtxos,
      //     null,
      //     2,
      //   )}`,
      // )

      // Get token UTXOs held by the wallet.
      const tokenUtxos = walletData.utxos.utxoStore.slpUtxos.type1.tokens

      // Find a token UTXO that contains PSF with a quantity higher than needed
      // to generate a proof-of-burn.
      let tokenUtxo = {}
      for (let i = 0; i < tokenUtxos.length; i++) {
        const thisUtxo = tokenUtxos[i]

        // If token ID matches.
        if (thisUtxo.tokenId === P2WDB_TOKEN_ID) {
          if (parseFloat(thisUtxo.tokenQty) >= PROOF_OF_BURN_QTY) {
            tokenUtxo = thisUtxo
            break
          }
        }
      }

      if (tokenUtxo.tokenId !== P2WDB_TOKEN_ID) {
        throw new Error(
          `Token UTXO of with ID of ${P2WDB_TOKEN_ID} and quantity greater than ${PROOF_OF_BURN_QTY} could not be found in wallet.`
        )
      }

      const result = await walletData.burnTokens(
        PROOF_OF_BURN_QTY,
        P2WDB_TOKEN_ID
      )
      // console.log('walletData.burnTokens() result: ', result)

      return result

      // return {
      //   success: true,
      //   txid: 'fakeTxid',
      // }
    } catch (err) {
      console.error('Error in burnPsf()')
      throw err
    }
  }

  // Write data to the P2WDB using the txid as proof-of-burn
  async p2wdbWrite (txid, signature, flags) {
    try {
      const now = new Date()

      // Data to be inserted into the database.
      const dataObj = {
        appId: flags.appId,
        title: flags.data,
        timestamp: now.toISOString(),
        localTimestamp: now.toLocaleString()
      }

      // Body of data to transmit via REST or JSON RPC
      const bodyData = {
        txid,
        message: flags.data,
        signature,
        data: JSON.stringify(dataObj)
      }

      // If centralized mode is selected
      if (flags.centralize) {
        const result = await this.axios.post(P2WDB_SERVER, bodyData)
        // console.log(`Response from API: ${JSON.stringify(result.data, null, 2)}`)

        return result.data.hash
      }

      // Decentralized mode.
      const hash = await this.p2wdbService.writeEntry(bodyData)
      return hash
    } catch (err) {
      console.error('Error in p2wdbWrite()')
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

    const data = flags.data
    if (!data || data === '') {
      throw new Error('You must specify a string of data with the -d flag.')
    }

    const appId = flags.appId
    if (!appId || appId === '') {
      throw new Error('You must specify an appId with the -a flag.')
    }

    const centralized = flags.centralized
    if (!centralized) {
      const p2wdbService = this.conf.get('p2wdbService')
      if (!p2wdbService) {
        throw new Error(
          'Use p2wdb-service command to select a service, or use -c argument for centralized mode.'
        )
      }
    }

    return true
  }
}

P2WDBWrite.description = 'Burn a specific quantity of SLP tokens.'

P2WDBWrite.flags = {
  name: flags.string({ char: 'n', description: 'Name of wallet' }),
  data: flags.string({
    char: 'd',
    description: 'String of data to write to the P2WDB'
  }),
  appId: flags.string({
    char: 'a',
    description: 'appId string to categorize data'
  }),
  centralized: flags.boolean({
    char: 'c',
    description: 'Use centralized mode to connect to P2WDB.'
  })
}

module.exports = P2WDBWrite
