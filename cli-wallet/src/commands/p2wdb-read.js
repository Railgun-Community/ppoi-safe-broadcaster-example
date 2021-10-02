/*
  Read data from the P2WDB.
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

// const P2WDB_SERVER = 'http://localhost:5001/entry/write'
const P2WDB_SERVER = 'https://p2wdb.fullstack.cash'

class P2WDBRead extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.walletBalances = new WalletBalances()
    this.p2wdbService = new P2wdbService()
    this.conf = new Conf()
  }

  async run () {
    try {
      const { flags } = this.parse(P2WDBRead)

      // Validate input flags
      this.validateFlags(flags)

      await this.readP2WDB(flags)
    } catch (err) {
      console.log('Error in p2wdb-read.js/run(): ', err)

      return 0
    }
  }

  // Read an entry from the P2WDB.
  async readP2WDB (flags) {
    try {
      // Centralized mode.
      if (flags.centralized) {
        const result = await axios.get(
          `${P2WDB_SERVER}/entry/hash/${flags.hash}`
        )
        console.log(`data: ${JSON.stringify(result.data, null, 2)}`)

        return
      }

      // Decentrlaized mode
      const result = await this.p2wdbService.getEntry(flags.hash)
      console.log('data: ', result)
    } catch (err) {
      console.error('Error in readP2WDB()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const hash = flags.hash
    if (!hash || hash === '') {
      throw new Error('You must specify a record hash with the -h flag.')
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

P2WDBRead.description = 'Burn a specific quantity of SLP tokens.'

P2WDBRead.flags = {
  hash: flags.string({ char: 'h', description: 'Hash representing P2WDB entry' }),
  centralized: flags.boolean({
    char: 'c',
    description: 'Use centralized mode to connect to P2WDB.'
  })
}

module.exports = P2WDBRead
