/*
  Send a some info to the Relayer to query the state of a smart contract.
*/

// Public NPM libraries
const Conf = require('conf');
const { Command, flags } = require('@oclif/command');

// Local libraries
const RelayerService = require('../lib/adapters/relayer-service');

class GetState extends Command {
  constructor(argv, config) {
    super(argv, config);

    // Encapsulate dependencies.
    this.relayerService = new RelayerService();
    this.conf = new Conf();
  }

  async run() {
    try {
      const { flags } = this.parse(GetState);

      const data = await this.getState(flags);
      console.log('Relayer message: ', data);
    } catch (err) {
      console.log('Error in railgun-submit-tx.js/run(): ', err);

      return 0;
    }
  }

  // Query the selected Relayer for information about its rate.
  async getState(flags) {
    try {
      const result = await this.relayerService.getState(flags.txid);
      // console.log('result: ', result);

      return result.message;
    } catch (err) {
      console.error('Error in getState()');
      throw err;
    }
  }
}

GetState.description = 'Query the state of a smart contract';

GetState.flags = {
  txid: flags.string({ char: 't', description: 'TXID to query for state' }),
};

module.exports = GetState;
