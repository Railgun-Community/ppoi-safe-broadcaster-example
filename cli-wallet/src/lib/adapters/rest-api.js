/*
  A class library for creating a Koa REST API. This API is used locally
  by the different wallet commands. This library translates the REST call
  from the different wallet commands into JSON RPC over IPFS.

  curl -X POST http://localhost:5000/ -d '{"test": "test"}'
*/

// Public npm libraries.
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const { v4: uid } = require('uuid')
const jsonrpc = require('jsonrpc-lite')

let _this

class RestApi {
  constructor (localConfig = {}) {
    this.eventEmitter = localConfig.eventEmitter
    if (!this.eventEmitter) {
      throw new Error(
        'An instance of an EventEmitter must be passed when instantiating the RestApi library.'
      )
    }
    this.ipfsCoordAdapter = localConfig.ipfsCoordAdapter
    if (!this.ipfsCoordAdapter) {
      throw new Error(
        'An instance of ipfsCoordAdapter must be passed when instantiating the RestApi library.'
      )
    }

    // Connect the RPC handler when the event fires with new data.
    this.eventEmitter.on('rpcData', this.rpcHandler)

    // encapsulate dependencies
    this.bodyParser = bodyParser
    this.uid = uid
    this.jsonrpc = jsonrpc

    // A queue for holding RPC data that has arrived.
    this.rpcDataQueue = []

    _this = this
  }

  // This handler is triggered when RPC data comes in over IPFS.
  // Handle RPC input, and match the input to the RPC queue.
  rpcHandler (data) {
    try {
      // Convert string input into an object.
      const jsonData = JSON.parse(data)

      // console.log(
      //   'rest-api.js/rpcHandler() data: ',
      //   JSON.stringify(jsonData, null, 2),
      // )
      console.log(`JSON RPC response for ID ${jsonData.id} received.`)

      _this.rpcDataQueue.push(jsonData)
    } catch (err) {
      console.error('Error in rest-api.js/rpcHandler(): ', err)
      // Do not throw error. This is a top-level function.
    }
  }

  // Launch the single REST API endpoint that the other app commands use to
  // broadcast JSON RPC commands to other IPFS peers.
  async startRestApi () {
    try {
      // Create a Koa instance.
      const app = new Koa()
      app.use(this.bodyParser())

      // Attach a router for the single POST endpoint.
      this.router = new Router({ prefix: '/' })

      // Normal API handler for interacting with other IPFS peers over JSON RPC.
      this.router.post('wallet/', this.apiHandler)

      // Local commands
      this.router.post('local/', this.localApiHandler)

      // P2WDB commands
      this.router.post('p2wdb/', this.p2wdbApiHandler)

      app.use(this.router.routes())
      app.use(this.router.allowedMethods())

      // Start the HTTP server.
      const port = 5000
      await app.listen(port)
      console.log(`REST API started on port ${port}`)

      return app
    } catch (err) {
      console.error('Error in startRestApi()')
      throw err
    }
  }

  // Update the pointer to the ipfs-coord adapter.
  // This allows the REST API to communicate over IPFS.
  async updateIpfsCoord (adapter) {
    this.ipfsCoordAdapter = adapter
    console.log('ipfsCoordAdapter updated in rest-api.js')
  }

  // This REST API deals with commands concerned with the health of the local
  // IPFS node.
  async localApiHandler (ctx, next) {
    try {
      console.log('Ping from localApiHandler()')

      if (ctx.request.body.relays) {
        // ctx.body = _this.ipfsCoordAdapter.ipfsCoord.thisNode.relayData
        ctx.body = _this.getRelays()
      } else if (ctx.request.body.peers) {
        const all = ctx.request.body.all
        ctx.body = await _this.getPeers(all)
      }
    } catch (err) {
      console.error('Error in localApiHandler()')
      throw err
    }
  }

  // Get data about the known Circuit Relays. Hydrate with data from peers list.
  getRelays () {
    try {
      const relayData = _this.ipfsCoordAdapter.ipfsCoord.thisNode.relayData
      const peerData = this.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log(`peerData: ${JSON.stringify(peerData, null, 2)}`)

      for (let i = 0; i < relayData.length; i++) {
        const thisRelay = relayData[i]

        // Find the peer that corresponds to this relay.
        const thisPeer = peerData.filter(x => x.from.includes(thisRelay.ipfsId))
        // console.log('thisPeer: ', thisPeer)

        // If the peer couldn't be found, skip.
        if (!thisPeer.length) {
          thisRelay.name = ''
          continue
        }

        thisRelay.name = thisPeer[0].data.jsonLd.name
      }

      return relayData
    } catch (err) {
      console.error('Error in getRelays(): ', err)
      return {}
    }
  }

  // Hydrate data about the peers connected to this IPFS node.
  async getPeers (showAll) {
    try {
      const peerData = this.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log(`peerData: ${JSON.stringify(peerData, null, 2)}`)

      let ipfsPeers =
        await this.ipfsCoordAdapter.ipfsCoord.adapters.ipfs.getPeers()
      // console.log('ipfsPeers: ', ipfsPeers)

      ipfsPeers = this._removeDuplicatePeers(ipfsPeers)
      // console.log('filtered ipfsPeers: ', ipfsPeers)

      // Loop through each IPFS peer and hydrate it with data from the peerData.
      for (let i = 0; i < ipfsPeers.length; i++) {
        const thisPeer = ipfsPeers[i]

        if (!showAll) {
          // Delete properties that don't contain good info.
          delete thisPeer.muxer
          delete thisPeer.latency
          delete thisPeer.streams
        }

        // Get the ipfs-coord peer data for this peer.
        let thisPeerData = peerData.filter(x => x.from.includes(thisPeer.peer))
        thisPeerData = thisPeerData[0]

        // Skip if peerData for this IPFS peer could not be found.
        if (!thisPeerData) continue

        try {
          // console.log('thisPeerData: ', thisPeerData)

          // Add data to the IPFS peer data.
          thisPeer.name = thisPeerData.data.jsonLd.name
          thisPeer.protocol = thisPeerData.data.jsonLd.protocol
          thisPeer.version = thisPeerData.data.jsonLd.version

          if (showAll) {
            // Add all the peer data.
            thisPeer.peerData = thisPeerData
          }
        } catch (err) {
          console.log(
            `Error trying to hydrate peer ${thisPeer.peer}: ${err.message}`
          )
        }
      }

      return ipfsPeers
    } catch (err) {
      console.error('Error in getPeers(): ', err)
      return {}
    }
  }

  // Expects an array of peers and returns an array of peers with duplicates
  // removed.
  _removeDuplicatePeers (arr) {
    // https://stackoverflow.com/questions/2218999/how-to-remove-all-duplicates-from-an-array-of-objects
    return arr.filter((v, i, a) => a.findIndex(t => t.peer === v.peer) === i)
  }

  // This function handles incoming REST API calls for wallet functions.
  async apiHandler (ctx, next) {
    try {
      // console.log('Ping from apiHandler()')

      // const body = ctx.request.body
      // console.log('Input: ', body)

      // Input Validation
      const sendTo = ctx.request.body.sendTo
      if (!sendTo) throw new Error('sendTo property must include an IPFS ID.')

      const rpcData = ctx.request.body.rpcData
      if (!rpcData) throw new Error('rpcData property required')

      // Generate a UUID to uniquly identify the response comming back from
      // the IPFS peer.
      const rpcId = _this.uid()
      // console.log('rpcId: ', rpcId)

      // Generate a JSON RPC command.
      const cmd = _this.jsonrpc.request(rpcId, 'bch', rpcData)
      const cmdStr = JSON.stringify(cmd)
      // console.log('cmdStr: ', cmdStr)

      // Send the RPC command to selected wallet service.
      const thisNode = _this.ipfsCoordAdapter.ipfsCoord.thisNode
      await _this.ipfsCoordAdapter.ipfsCoord.useCases.peer.sendPrivateMessage(
        sendTo,
        cmdStr,
        thisNode
      )

      // Wait for data to come back from the wallet service.
      const data = await _this.waitForRPCResponse(rpcId)

      ctx.body = data
    } catch (err) {
      console.error('Error in apiHandler()')
      throw err
    }
  }

  // This function handles incoming REST API calls for wallet functions.
  async p2wdbApiHandler (ctx, next) {
    try {
      // console.log('Ping from apiHandler()')

      // const body = ctx.request.body
      // console.log('Input: ', body)

      // Input Validation
      const sendTo = ctx.request.body.sendTo
      if (!sendTo) throw new Error('sendTo property must include an IPFS ID.')

      const rpcData = ctx.request.body.rpcData
      if (!rpcData) throw new Error('rpcData property required')

      // Generate a UUID to uniquly identify the response comming back from
      // the IPFS peer.
      const rpcId = _this.uid()
      // console.log('rpcId: ', rpcId)

      // Generate a JSON RPC command.
      const cmd = _this.jsonrpc.request(rpcId, 'p2wdb', rpcData)
      const cmdStr = JSON.stringify(cmd)
      // console.log('cmdStr: ', cmdStr)

      // Send the RPC command to selected wallet service.
      const thisNode = _this.ipfsCoordAdapter.ipfsCoord.thisNode
      await _this.ipfsCoordAdapter.ipfsCoord.useCases.peer.sendPrivateMessage(
        sendTo,
        cmdStr,
        thisNode
      )

      // Wait for data to come back from the wallet service.
      const data = await _this.waitForRPCResponse(rpcId)

      ctx.body = data
    } catch (err) {
      console.error('Error in p2wdbHandler()')
      throw err
    }
  }

  // Returns a promise that resolves to data when the RPC response is recieved.
  async waitForRPCResponse (rpcId) {
    try {
      // Initialize variables for tracking the return data.
      let dataFound = false
      let cnt = 0
      let data = {
        success: false,
        message: 'request timed out',
        data: ''
      }

      // Loop that waits for a response from the service provider.
      do {
        for (let i = 0; i < this.rpcDataQueue.length; i++) {
          const rawData = this.rpcDataQueue[i]
          // console.log(`rawData: ${JSON.stringify(rawData, null, 2)}`)

          if (rawData.id === rpcId) {
            dataFound = true
            // console.log('data was found in the queue')

            data = rawData.result.value

            // Remove the data from the queue
            this.rpcDataQueue.splice(i, 1)

            break
          }
        }

        // Wait between loops.
        // await this.sleep(1000)
        await this.ipfsCoordAdapter.bchjs.Util.sleep(2000)

        cnt++

        // Exit if data was returned, or the window for a response expires.
      } while (!dataFound && cnt < 10)
      // console.log(`dataFound: ${dataFound}, cnt: ${cnt}`)

      return data
    } catch (err) {
      console.error('Error in waitForRPCResponse()')
      throw err
    }
  }
}

module.exports = RestApi
