/*
  This daemon command spins up a new IPFS node, using ipfs-coord. It connects
  to the PSF subnetwork on IPFS, searches for and selects a wallet service.

  The daemon also starts a small REST API server that the other wallet commands
  connect to, in order to send JSON RPC commands to the services on the IPFS
  subnet.
*/

// Public npm libraries
const BCHJS = require('@psf/bch-js')
const { Command } = require('@oclif/command')
const EventEmitter = require('events')

// Local libraries.
const RestApi = require('../lib/adapters/rest-api')
const IpfsAdapter = require('../lib/adapters/ipfs')
const IpfsCoordAdapter = require('../lib/adapters/ipfs-coord')

class Daemon extends Command {
  constructor (argv, config) {
    super(argv, config)
    // _this = this

    // Encapsulate dependencies.
    this.eventEmitter = new EventEmitter()
    this.bchjs = new BCHJS()
    this.ipfsCoordAdapter = {} // placeholder
    this.restApi = new RestApi({
      eventEmitter: this.eventEmitter,
      ipfsCoordAdapter: this.ipfsCoordAdapter
    })
    this.ipfsAdapter = new IpfsAdapter()
    this.IpfsCoordAdapter = IpfsCoordAdapter

    this.ipfs = {} // placeholder
  }

  async start () {
    try {
      // Start IPFS
      await this.ipfsAdapter.start()
      console.log('IPFS is ready.')

      // this.ipfs is a Promise that will resolve into an instance of an IPFS node.
      this.ipfs = this.ipfsAdapter.ipfs

      // Start ipfs-coord
      this.ipfsCoordAdapter = new this.IpfsCoordAdapter({
        ipfs: this.ipfs,
        bchjs: this.bchjs,
        eventEmitter: this.eventEmitter
      })
      await this.ipfsCoordAdapter.start()
      console.log('ipfs-coord is ready.')

      // Pass the ipfsCoordAdapter instance to the REST API library.
      this.restApi.updateIpfsCoord(this.ipfsCoordAdapter)

      return true
    } catch (err) {
      console.error('Error in start()')
      throw err
    }
  }

  // This handler function recieves data from other ipfs-coord peers.
  rpcHandler (inData) {
    try {
      console.log('Data recieved by rpcHandler: ', inData)

      const jsonData = JSON.parse(inData)
      console.log('jsonData: ', jsonData)

      // _this.eventEmitter.emit('rpcData', jsonData)
    } catch (err) {
      console.error('Error in rpcHandler()')
      // Do not throw an error. This is a top-level function.
    }
  }

  async run () {
    // const {flags} = this.parse(Daemon)
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/commands/hello.js`)

    await this.startDaemon()
  }

  async startDaemon () {
    // Connect to the IPFS network.
    await this.start()

    // Create a REST endpoint to accept input from the other commands in this app.
    await this.restApi.startRestApi()
  }
}

Daemon.description = `Start a daemon connection to the wallet service.
This command will start a 'daemon' service, which is a IPFS node that will
connect to a BCH wallet service over IPFS. It will also start a REST API
server, which is how the other commands in this app will communicate with
the BCH wallet service.
`

Daemon.flags = {
  // name: flags.string({ char: 'n', description: 'name to print' })
}

module.exports = Daemon
