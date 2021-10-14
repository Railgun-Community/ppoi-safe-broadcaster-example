/*
  Unit tests for the railgun-about command.
*/

// Public npm packages.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const RailgunService = require('../../../src/commands/railgun-service')
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-about', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new RailgunService()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#selectService', () => {
    it('should select a service and return true', () => {
      // Mock dependencies so real config is not changed.
      sandbox.stub(uut.conf, 'set').returns()

      const flags = {
        select: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp'
      }

      const result = uut.selectService(mockPeers, flags)
      // console.log('result: ', result);

      assert.equal(result, true)
    })

    it('should return false if service can not be found', () => {
      // Mock dependencies so real config is not changed.
      sandbox.stub(uut.conf, 'set').returns()

      const flags = {
        select: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKo'
      }

      const result = uut.selectService(mockPeers, flags)
      // console.log('result: ', result);

      assert.equal(result, false)
    })

    it('should catch and throw errors', () => {
      try {
        uut.selectService()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log(err);
        assert.include(err.message, 'Cannot read property')
      }
    })
  })

  describe('#getServicePeers', () => {
    it('should return all the service peers', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: mockPeers })
      const flags = {}

      const result = await uut.getServicePeers(flags)
      // console.log('result: ', result);

      // Result should be an array with one element.
      assert.isArray(result)
      assert.equal(result.length, 1)

      // Property should have expected properties.
      assert.property(result[0], 'addr')
      assert.property(result[0], 'peer')
      assert.property(result[0], 'direction')
      assert.property(result[0], 'name')
      assert.property(result[0], 'protocol')
      assert.property(result[0], 'version')
      assert.property(result[0], 'isSelected')
    })

    it('should catch, report, and throw errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.axios, 'post').rejects(new Error('test error'))

        await uut.getServicePeers()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    // TODO:
    // it('should handle peers without a protocol specified')

    // TODO:
    // it('should set a new service peer when select flag is present')
  })

  describe('#run', () => {
    it('should report service peers and return true', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'parse').returns({ flags: {} })
      sandbox.stub(uut, 'getServicePeers').resolves(mockPeers[0])

      const result = await uut.run()
      // console.log('result: ', result);

      assert.equal(result, true)
    })

    it('should report errors and return false', async () => {
      const result = await uut.run()

      assert.equal(result, false)
    })
  })
})

const mockPeers = [
  {
    addr: '/ip4/143.198.60.119/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    peer: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    direction: 'outbound',
    name: 'trout-dev-railgun-relay',
    protocol: 'railgun-relayer',
    version: '1.0.1'
  },
  {
    addr: '/ip4/139.162.76.54/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    peer: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    direction: 'outbound',
    name: 'ipfs-relay-tokyo-pfs-0945772',
    protocol: 'generic-service',
    version: '1.3.0'
  }
]
