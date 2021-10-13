/*
  Unit tests for the railgun-about command.
*/

// Public npm packages.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const RailgunAbout = require('../../../src/commands/railgun-about')
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-about', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new RailgunAbout()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#getAbout', () => {
    it('should query the relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.relayerService, 'getAbout').resolves({ key: 'value' })

      const result = await uut.getAbout()
      // console.log('result: ', result);

      assert.isObject(result)
      assert.property(result, 'key')
      assert.equal(result.key, 'value')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Mock dependencies
        sandbox.stub(uut.relayerService, 'getAbout').rejects(new Error('test error'))

        await uut.getAbout()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })
  })

  describe('#run', () => {
    it('should catch an error and return false', async () => {
      sandbox.stub(uut, 'getAbout').rejects(new Error('test error'))

      const result = await uut.run()

      assert.equal(result, 0)
    })

    it('should display data about the relayer node', async () => {
      sandbox.stub(uut, 'getAbout').resolves(mockData)

      await uut.run()

      assert.isOk(true)
    })
  })
})

// Simulates the response from a Relayer node.
const mockData = {
  success: true,
  status: 200,
  message:
    '{"@context":"https://schema.org/","@type":"WebAPI","name":"trout-dev-railgun-relay","version":"1.0.1","protocol":"railgun-relayer","description":"This is a generic Railgun Relayer. It has not been customized.","documentation":"https://www.railgun.org/","provider":{"@type":"Organization","name":"Railgun DAO","url":"https://www.railgun.org/"},"identifier":"QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp"}',
  endpoint: 'about'
}
