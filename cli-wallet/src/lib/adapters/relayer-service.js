/*
  This library interacts with the relayer-service via the JSON RPC
  over IPFS.

  Commands from the CLI wallet call this library. The purpose of this library
  is to convert the commands into an RPC call, and then pipe that command to
  the selected Relayer. It does that by calling a generic REST API endpoint
  running on the local machine.
*/

// Configuration variables.
const LOCAL_REST_API = 'http://localhost:5000/relayer/';

// Public npm libraries.
const axios = require('axios');
const Conf = require('conf');

class RelayerService {
  constructor(localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios;
    this.conf = new Conf();
  }

  checkServiceId() {
    // this.conf = new Conf()

    const serviceId = this.conf.get('selectedService');

    if (!serviceId) {
      throw new Error('Relayer service ID does not exist in config.');
    }

    return serviceId;
  }

  // Query the /about RPC endpoint.
  async getAbout() {
    try {
      const serviceId = this.checkServiceId();

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'about',
          params: {},
        },
      });
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message);

      return result.data;
    } catch (err) {
      console.error('Error in getAbout()');
      throw err;
    }
  }

  // Get the Rate to be paid to the Relayer for relaying the transaction.
  async getRate() {
    try {
      const serviceId = this.checkServiceId();

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'rate',
          params: {},
        },
      });
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message);

      return result.data;
    } catch (err) {
      console.error('Error in getRate()');
      throw err;
    }
  }

  // Submit the TX hex to the Relayer.
  async submitTx(hex) {
    try {
      const serviceId = this.checkServiceId();

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'submitTx',
          params: {
            hex,
          },
        },
      });
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);

      return result.data;
    } catch (err) {
      console.error('Error in submitTx()');
      throw err;
    }
  }

  // Get State
  async getState(txid) {
    try {
      const serviceId = this.checkServiceId();

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'getState',
          params: {
            txid,
          },
        },
      });
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`);

      return result.data;
    } catch (err) {
      console.error('Error in getState()');
      throw err;
    }
  }
}

module.exports = RelayerService;
