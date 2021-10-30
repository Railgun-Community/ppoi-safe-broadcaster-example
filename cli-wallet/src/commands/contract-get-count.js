/*
  Get the current count of the contract.
*/

// Public NPM libraries
const Conf = require('conf');
const { Command } = require('@oclif/command');
const { ethers } = require('ethers');

// Local libraries
// const RelayerService = require('../lib/adapters/relayer-service')

class ContractCount extends Command {
  constructor(argv, config) {
    super(argv, config);

    // Encapsulate dependencies.
    // this.relayerService = new RelayerService()
    this.conf = new Conf();
    this.ethers = ethers;

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

      const data = await this.getCount();
      console.log('Contract counter value: ', data);
    } catch (err) {
      console.log('Error in railgun-rate.js/run(): ', err);

      return 0;
    }
  }

  // Query the selected Relayer for information about its rate.
  async getCount() {
    try {
      // Get the current state of the contract.
      const currentCount = await this.contract.getCount();
      // console.log(`Current count: ${currentCount.toString()}\n`);

      return currentCount.toString();
    } catch (err) {
      console.error('Error in getRate()');
      throw err;
    }
  }
}

ContractCount.description = 'Get the current count (state) of the contract';

ContractCount.flags = {};

module.exports = ContractCount;
