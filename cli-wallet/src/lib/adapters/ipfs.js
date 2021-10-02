/*
  An adapter library for customizing the connection between this app and the
  IPFS network.
*/

// Global npm libraries
const IPFS = require('@chris.troutner/ipfs')

class IpfsAdapter {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.IPFS = IPFS

    // Properties of this class instance.
    this.isReady = false
    // this.config = config
  }

  // Start an IPFS node.
  async start () {
    try {
      // Ipfs Options
      const ipfsOptions = {
        repo: './.ipfsdata',
        start: true,
        config: {
          relay: {
            enabled: true, // enable circuit relay dialer and listener
            hop: {
              enabled: false // enable circuit relay HOP (make this node a relay)
            }
          },
          pubsub: true, // enable pubsub
          Swarm: {
            ConnMgr: {
              HighWater: 30,
              LowWater: 10
            }
          },
          preload: {
            enabled: false
          },
          offline: true
        }
      }

      // Create a new IPFS node.
      this.ipfs = await this.IPFS.create(ipfsOptions)

      // Set the 'server' profile so the node does not scan private networks.
      // await this.ipfs.config.profiles.apply('server')
      await this.ipfs.config.profiles.apply('lowpower')

      // const nodeConfig = await this.ipfs.config.getAll()
      // console.log(
      //   `IPFS node configuration: ${JSON.stringify(nodeConfig, null, 2)}`
      // )

      // Stop the IPFS node if we're running tests.
      // if (this.config.env === 'test') {
      //   console.log('Stopping IPFS for tests.')
      //   await this.ipfs.stop()
      // }

      // Signal that this adapter is ready.
      this.isReady = true

      return this.ipfs
    } catch (err) {
      console.error('Error in ipfs.js/start()')
      throw err
    }
  }
}

module.exports = IpfsAdapter
