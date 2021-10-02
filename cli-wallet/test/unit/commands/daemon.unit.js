/*
  Unit tests for the daemon index.js file.
*/

// Public npm libraries.
const assert = require('chai').assert
const sinon = require('sinon')

// Local libraries
const Daemon = require('../../../src/commands/daemon')
const IPFSMock = require('../../mocks/ipfs-mock')
const IPFSCoordMock = require('../../mocks/ipfs-coord-mock')

describe('#daemon', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new Daemon()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#constructor', () => {
    it('should instantiate the class', () => {
      uut = new Daemon()

      assert.property(uut, 'bchjs')
      assert.property(uut, 'restApi')
    })
  })

  describe('#start', () => {
    it('should start an IPFS node', async () => {
      // mock dependencies.
      uut.ipfsAdapter = new IPFSMock()
      uut.IpfsCoordAdapter = IPFSCoordMock

      const result = await uut.start()

      assert.equal(result, true)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.ipfsAdapter, 'start').rejects(new Error('test error'))

        await uut.start()

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#rpcHandler', () => {
    it('should parse JSON input', () => {
      uut.rpcHandler('{"test": "test"}')
    })

    it('should catch and throw an error', async () => {
      try {
        uut.rpcHandler('abc')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'SyntaxError')
      }
    })
  })

  describe('#run', () => {
    it('should parse flags and run the daemon', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'parse').returns({ flags: { name: 'test' } })
      sandbox.stub(uut, 'startDaemon').resolves({})

      await uut.run()
    })
  })

  describe('#startDaemon', () => {
    it('should start the daemon', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'start').resolves({})
      sandbox.stub(uut.restApi, 'startRestApi').resolves({})

      await uut.startDaemon()
    })
  })
})
