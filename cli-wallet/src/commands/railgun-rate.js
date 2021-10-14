/*
  Query the /rate endpoint of the selected Railgun Relay.
*/

// Public NPM libraries
const Conf = require('conf')
const { Command } = require('@oclif/command')

// Local libraries
const RelayerService = require('../lib/adapters/relayer-service')

class Rate extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.relayerService = new RelayerService()
    this.conf = new Conf()
  }

  async run () {
    try {
      // const { flags } = this.parse(About);

      const data = await this.getRate()
      console.log('Relayer rate: ', data)
    } catch (err) {
      console.log('Error in railgun-rate.js/run(): ', err)

      return 0
    }
  }

  // Query the selected Relayer for information about its rate.
  async getRate () {
    try {
      const result = await this.relayerService.getRate()
      // console.log('data: ', result);

      return result.message
    } catch (err) {
      console.error('Error in getRate()')
      throw err
    }
  }
}

Rate.description = 'Query the /rate RPC endpoint of the selected Railgun Relay.'

Rate.flags = {}

module.exports = Rate
