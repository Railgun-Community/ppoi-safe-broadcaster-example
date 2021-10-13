/*
  Query the /about endpoint of the selected Railgun Relay.
*/

// Public NPM libraries
const Conf = require('conf')
const { Command } = require('@oclif/command')

// Local libraries
const RelayerService = require('../lib/adapters/relayer-service')

class About extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.relayerService = new RelayerService()
    this.conf = new Conf()
  }

  async run () {
    try {
      // const { flags } = this.parse(About);

      const data = await this.getAbout()
      console.log('About data: ', data)

      if (data.message) {
        const message = JSON.parse(data.message)
        console.log(`About message: ${JSON.stringify(message, null, 2)}`)
      }
    } catch (err) {
      console.log('Error in railgun-about.js/run(): ', err)

      return 0
    }
  }

  // Query the selected Relayer for information about itself.
  async getAbout () {
    try {
      // Decentrlaized mode
      const result = await this.relayerService.getAbout()
      // console.log('data: ', result);

      return result
    } catch (err) {
      console.error('Error in getAbout()')
      throw err
    }
  }
}

About.description = 'Query the /about RPC endpoint of the selected Railgun Relay.'

About.flags = {}

module.exports = About
