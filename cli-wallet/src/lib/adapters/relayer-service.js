/*
  This library interacts with the relayer-service via the JSON RPC
  over IPFS.
*/

// Configuration variables.
const LOCAL_REST_API = 'http://localhost:5000/relayer/'

// Public npm libraries.
const axios = require('axios')
const Conf = require('conf')

class RelayerService {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.conf = new Conf()
  }

  checkServiceId () {
    // this.conf = new Conf()

    const serviceId = this.conf.get('selectedService')

    if (!serviceId) {
      throw new Error('Relayer service ID does not exist in config.')
    }

    return serviceId
  }

  // Query the /about RPC endpoint.
  async getAbout () {
    try {
      const serviceId = this.checkServiceId()

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'about',
          params: {}
        }
      })
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message)

      return result.data
    } catch (err) {
      console.error('Error in getAbout()')
      throw err
    }
  }

  // Query the /about RPC endpoint.
  async getRate () {
    try {
      const serviceId = this.checkServiceId()

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          method: 'rate',
          params: {}
        }
      })
      console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message)

      return result.data
    } catch (err) {
      console.error('Error in getAbout()')
      throw err
    }
  }
}

module.exports = RelayerService
