/*
  Unit tests for the IPFS Adapter.
*/

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')
const cloneDeep = require('lodash.clonedeep')
const EventEmitter = require('events')
const BCHJS = require('@psf/bch-js')

// Local libraries
const IPFSCoordAdapter = require('../../../../src/lib/adapters/ipfs-coord')
const IPFSMock = require('../../../mocks/ipfs-mock')
const IPFSCoordMock = require('../../../mocks/ipfs-coord-mock')
const mockDataLib = require('../../../mocks/ipfs-coord-mocks')

describe('#ipfs-coord', () => {
  let uut
  let sandbox
  let mockData

  beforeEach(() => {
    const ipfs = IPFSMock.create()
    const bchjs = new BCHJS()
    const eventEmitter = new EventEmitter()
    uut = new IPFSCoordAdapter({ ipfs, bchjs, eventEmitter })

    mockData = cloneDeep(mockDataLib)

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if ipfs instance is not included', () => {
      try {
        uut = new IPFSCoordAdapter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of IPFS must be passed when instantiating ipfs-coord adapter.'
        )
      }
    })

    it('should throw an error if bchjs instance is not included', () => {
      try {
        const ipfs = IPFSMock.create()
        uut = new IPFSCoordAdapter({ ipfs })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of bch-js must be passed when instantiating ipfs-coord adapter.'
        )
      }
    })

    it('should throw an error if EventEmitter instance is not included', () => {
      try {
        const ipfs = IPFSMock.create()
        const bchjs = new BCHJS()
        uut = new IPFSCoordAdapter({ ipfs, bchjs })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'An instance of an EventEmitter must be passed when instantiating the ipfs-coord adapter.'
        )
      }
    })
  })

  describe('#start', () => {
    it('should return a promise that resolves into an instance of IPFS.', async () => {
      // Mock dependencies.
      uut.IpfsCoord = IPFSCoordMock

      const result = await uut.start()
      // console.log('result: ', result)

      assert.equal(result, true)
    })
  })

  describe('#attachRPCRouter', () => {
    it('should attached a router output', async () => {
      // Mock dependencies
      uut.ipfsCoord = {
        privateLog: {},
        ipfs: {
          orbitdb: {
            privateLog: {}
          }
        }
      }

      const router = console.log

      uut.attachRPCRouter(router)
    })

    it('should throw an error if ipfs-coord has not been instantiated', () => {
      try {
        const router = console.log

        uut.attachRPCRouter(router)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#pollForServices', () => {
    it('should find and select the wallet service', () => {
      uut.ipfsCoord = {
        thisNode: {
          peerList: mockData.peers,
          peerData: mockData.peerData
        }
      }

      uut.pollForServices()

      // It should fine the service in the mocked data.
      assert.equal(
        uut.state.selectedServiceProvider,
        'QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2'
      )
    })

    it('should catch and report errors', () => {
      uut.pollForServices()

      assert.isOk(true, 'Not throwing an error is a success.')
    })
  })

  describe('#peerInputHandler', () => {
    it('should emit an event trigger', () => {
      const data = 'some data'

      uut.peerInputHandler(data)

      assert.isOk(true, 'Not throwing an error is a success')
    })

    it('should catch and report errors', () => {
      // Force an error
      sandbox.stub(uut.eventEmitter, 'emit').throws(new Error('test error'))

      uut.peerInputHandler()

      assert.isOk(true, 'Not throwing an error is a success.')
    })
  })
})
