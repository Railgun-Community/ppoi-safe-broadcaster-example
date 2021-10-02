/*
  This library interacts with the ipfs-p2wdb-service via the JSON RPC
  over IPFS.
*/

// Configuration variables.
const LOCAL_REST_API = 'http://localhost:5000/p2wdb/'

// Public npm libraries.
const axios = require('axios')
const Conf = require('conf')

class P2wdbService {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.axios = axios
    this.conf = new Conf()
  }

  checkServiceId () {
    // this.conf = new Conf()

    const serviceId = this.conf.get('p2wdbService')

    if (!serviceId) {
      throw new Error('P2WDB service ID does not exist in config.')
    }

    return serviceId
  }

  // Read an entry from the P2WDB, given an entry hash.
  async getEntry (hash) {
    try {
      // Input validation.
      if (!hash || typeof hash !== 'string') {
        throw new Error('getEntry() input hash must be a string.')
      }

      const serviceId = this.checkServiceId()

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          endpoint: 'getByHash',
          hash
        }
      })
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message)

      return result.data
    } catch (err) {
      console.error('Error in getEntry()')
      throw err
    }
  }

  // Write an entry to the P2WDB
  async writeEntry (data) {
    try {
      const serviceId = this.checkServiceId()

      const result = await this.axios.post(LOCAL_REST_API, {
        sendTo: serviceId,
        rpcData: {
          endpoint: 'write',
          txid: data.txid,
          message: data.message,
          signature: data.signature,
          data: data.data
        }
      })
      // console.log(`result.data: ${JSON.stringify(result.data, null, 2)}`)

      // If there is a timeout or other network failure.
      if (result.data.success === false) throw new Error(result.data.message)

      // The hash of the new entry.
      return result.data.data
    } catch (err) {
      console.error('Error in writeEntry()')
      throw err
    }
  }
}

module.exports = P2wdbService
