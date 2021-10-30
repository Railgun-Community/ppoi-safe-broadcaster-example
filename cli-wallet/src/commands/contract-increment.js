/*
  Increment the contract counter by generating an increment TX and routing
  that tx through the Relayer
*/

// Public NPM libraries
const Conf = require('conf');
const { Command } = require('@oclif/command');
const { ethers } = require('ethers');

// Local libraries
// const RelayerService = require('../lib/adapters/relayer-service')
const SubmitTx = require('./railgun-submit-tx');

class ContractIncrement extends Command {
  constructor(argv, config) {
    super(argv, config);

    // Encapsulate dependencies.
    // this.relayerService = new RelayerService()
    this.conf = new Conf();
    this.ethers = ethers;
    this.submitTx = new SubmitTx(argv, config);

    // Configure wallet
    this.provider = new ethers.providers.JsonRpcProvider('https://rpc.goerli.mudit.blog');

    // Define the contract ABI
    const contractAddr = '0x78d3bcdd9ae4b5f26bd60cd8014412528f68a4a7';
    const contractAbi = [
      'function getCount() view returns (uint)',
      'function increment()',
      'function decrement()',
      'event Increment(uint value)',
      'event Decrement(uint value)',
    ];
    this.contract = new ethers.Contract(contractAddr, contractAbi, this.provider);
  }

  async run() {
    try {
      // const { flags } = this.parse(About);

      const data = await this.incrementCount();
      console.log('txid: ', data);
    } catch (err) {
      console.log('Error in railgun-rate.js/run(): ', err);

      return 0;
    }
  }

  // Increment the count in the contract, by routing the contract through
  // the Relayer.
  async incrementCount() {
    try {
      // Generate an unsigned transaction.
      const unsignedTx = await this.contract.populateTransaction.increment();

      // Set the transaction for the Goerli testnet
      unsignedTx.chainId = 5;

      // Serialize the unsigned transaction.
      // This prepares the transaction to be sent to the Relayer.
      const serializedTx = this.ethers.utils.serializeTransaction(unsignedTx);

      const flags = {
        hex: serializedTx,
      };

      // Submit the unsigned transaction to the Relayer
      const txid = await this.submitTx.submitTx(flags);

      return txid;
    } catch (err) {
      console.error('Error in getRate()');
      throw err;
    }
  }
}

ContractIncrement.description = 'Increment smart contact by relaying transaction through Relayer';

ContractIncrement.flags = {};

module.exports = ContractIncrement;
