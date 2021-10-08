/*
  Query the /about endpoint of the selected Railgun Relay.
*/

// Public NPM libraries
// const BchWallet = require('minimal-slp-wallet/index');
// const axios = require('axios');
const Conf = require('conf')

// Local libraries
const { Command } = require('@oclif/command')
// const WalletUtil = require('../lib/wallet-util');
// const WalletBalances = require('./wallet-balances');
const RelayerService = require('../lib/adapters/relayer-service')

// const P2WDB_SERVER = 'http://localhost:5001/entry/write'
// const P2WDB_SERVER = 'https://p2wdb.fullstack.cash';

class About extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    // this.walletUtil = new WalletUtil();
    // this.BchWallet = BchWallet;
    // this.walletBalances = new WalletBalances();
    this.relayerService = new RelayerService()
    this.conf = new Conf()
  }

  async run () {
    try {
      const { flags } = this.parse(About)

      // Validate input flags
      this.validateFlags(flags)

      await this.getAbout(flags)
    } catch (err) {
      console.log('Error in p2wdb-read.js/run(): ', err)

      return 0
    }
  }

  async getAbout (flags) {
    try {
      // Decentrlaized mode
      const result = await this.relayerService.getAbout()
      console.log('data: ', result)
    } catch (err) {
      console.error('Error in getAbout()')
      throw err
    }
  }

  // Read an entry from the P2WDB.
  async readP2WDB (flags) {
    try {
      // Centralized mode. Copied from psf-bch-wallet. Not used in Railgun.
      // if (flags.centralized) {
      //   const result = await axios.get(`${P2WDB_SERVER}/entry/hash/${flags.hash}`)
      //   console.log(`data: ${JSON.stringify(result.data, null, 2)}`)
      //
      //   return
      // }

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
    return true
  }
}

About.description = 'Query the /about RPC endpoint of the selected Railgun Relay.'

About.flags = {}

module.exports = About
