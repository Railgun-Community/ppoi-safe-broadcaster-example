/*
  Unit tests for the rest-api adapter library.
*/

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const EventEmitter = require('events')
const BCHJS = require('@psf/bch-js')

// Local libraries
const RestApi = require('../../../../src/lib/adapters/rest-api')
const { context } = require('../../../mocks/ctx-mock')
const IpfsCoordAdapter = require('../../../../src/lib/adapters/ipfs-coord')
const IPFSMock = require('../../../mocks/ipfs-mock')
const mockDataLib = require('../../../mocks/rest-api-mocks')

describe('#REST-API', () => {
  let sandbox
  let uut
  let ctx
  let mockData

  beforeEach(async () => {
    const eventEmitter = new EventEmitter()
    const ipfs = IPFSMock.create()
    const bchjs = new BCHJS()
    const ipfsCoordAdapter = new IpfsCoordAdapter({ ipfs, bchjs, eventEmitter })

    sandbox = sinon.createSandbox()

    ctx = context()
    mockData = cloneDeep(mockDataLib)

    uut = new RestApi({ eventEmitter, ipfsCoordAdapter })
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should throw an error if EventEmitter instance is not included', () => {
      try {
        uut = new RestApi()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'An instance of an EventEmitter must be passed when instantiating the RestApi library.'
        )
      }
    })

    it('should throw an error if ipfs-coord adapter instance is not included', () => {
      try {
        const eventEmitter = new EventEmitter()

        uut = new RestApi({ eventEmitter })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'An instance of ipfsCoordAdapter must be passed when instantiating the RestApi library.'
        )
      }
    })
  })

  describe('#rpcHandler', () => {
    it('should add data to the queue', () => {
      const data = '{ "data": "some data" }'

      uut.rpcHandler(data)

      assert.property(uut.rpcDataQueue[0], 'data')
    })

    it('should catch and throw and error', () => {
      // Force JSON.parse() to throw an error.
      uut.rpcHandler('{"blah"}')

      // console.log('uut.rpcDataQueue: ', uut.rpcDataQueue)

      // Not throwing an error is a pass.
      assert.isOk(true)
    })
  })

  describe('#startRestApi', () => {
    it('should start and return a Koa REST API server', async () => {
      const app = await uut.startRestApi()
      // console.log('app: ', app)

      assert.isOk(app, 'Not throwing an error is a pass')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'bodyParser').throws(new Error('test error'))

        await uut.startRestApi()

        assert.fail('Unexpected code path.')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#waitForRPCResponse', () => {
    it('should should resolve when data is received', async () => {
      // Mock data.
      const rpcId = '123'
      uut.rpcDataQueue.push(mockData.rpcData)

      const result = await uut.waitForRPCResponse(rpcId)
      // console.log('result: ', result)

      assert.property(result, 'success')
      assert.equal(result.success, true)
      assert.property(result, 'balances')
      assert.isArray(result.balances)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.ipfsCoordAdapter.bchjs.Util, 'sleep')
          .rejects(new Error('test error'))

        // Mock data.
        const rpcId = '123'
        uut.rpcDataQueue.push(mockData.rpcData)

        await uut.waitForRPCResponse(rpcId)

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('error: ', err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#apiHandler', () => {
    it('should throw an error if sendTo property is not included in body', async () => {
      try {
        ctx.request.body = {}

        await uut.apiHandler(ctx)

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'sendTo property must include an IPFS ID.')
      }
    })

    it('should throw an error if rpcData property is not included in body', async () => {
      try {
        ctx.request.body = { sendTo: 'fakeIPFSid' }

        await uut.apiHandler(ctx)

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'rpcData property required')
      }
    })

    it('should send data to service and return response', async () => {
      ctx.request.body = {
        sendTo: 'fakeIPFSid',
        rpcData: {
          endpoint: 'utxos',
          address: 'fakeAddress'
        }
      }

      // Mock dependencies
      uut.ipfsCoordAdapter.ipfsCoord.useCases = {
        peer: {
          sendPrivateMessage: () => {}
        }
      }
      sandbox.stub(uut, 'waitForRPCResponse').resolves('some data')

      await uut.apiHandler(ctx)

      // console.log('ctx.body: ', ctx.body)
      assert.equal(ctx.body, 'some data')
    })
  })

  describe('#localApiHandler', () => {
    it('should catch and throw errors', async () => {
      try {
        ctx.request = {}

        await uut.localApiHandler(ctx)

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'Cannot read property')
      }
    })

    it('should report the state of circuit relays', async () => {
      // Mock dependencies
      // uut.ipfsCoordAdapter.ipfsCoord.thisNode = {
      //   relayData: 'test data'
      // }
      sandbox.stub(uut, 'getRelays').returns('test data')

      ctx.request.body = {
        relays: true
      }

      await uut.localApiHandler(ctx)

      // console.log('ctx.body: ', ctx.body)

      assert.equal(ctx.body, 'test data')
    })
  })
})
