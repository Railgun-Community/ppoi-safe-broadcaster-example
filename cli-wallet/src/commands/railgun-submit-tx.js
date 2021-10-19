/*
  Send a TX to the Relayer, to be broadcast on behalf this wallet.
*/

// Public NPM libraries
const Conf = require('conf')
const { Command, flags } = require('@oclif/command')

// Local libraries
const RelayerService = require('../lib/adapters/relayer-service')

class SubmitTx extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.relayerService = new RelayerService()
    this.conf = new Conf()
  }

  async run () {
    try {
      const { flags } = this.parse(SubmitTx)

      const data = await this.submitTx(flags)
      console.log('Relayer message: ', data)
    } catch (err) {
      console.log('Error in railgun-submit-tx.js/run(): ', err)

      return 0
    }
  }

  // Query the selected Relayer for information about its rate.
  async submitTx (flags) {
    try {
      const result = await this.relayerService.submitTx(flags.hex)
      // console.log('result: ', result);

      return result.message
    } catch (err) {
      console.error('Error in submitTx()')
      throw err
    }
  }
}

SubmitTx.description = 'Send a TX to the Relayer, to be broadcast on behalf this wallet.'

SubmitTx.flags = {
  hex: flags.string({ char: 'e', description: 'Hex string of a tx to send to Relayer' })
}

module.exports = SubmitTx
