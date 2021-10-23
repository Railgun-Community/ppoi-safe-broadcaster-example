/*
  Unit tests for the relayer-service adapter library.
*/

// Public npm libraries.
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const RelayerService = require('../../../../src/lib/adapters/relayer-service')

describe('#relayer-service.js', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new RelayerService()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#checkServiceId', () => {
    it('should return the selected service ID', () => {
      // Mock dependencies
      sandbox.stub(uut.conf, 'get').returns('Qmsomething')

      const result = uut.checkServiceId()
      // console.log('result: ', result);

      // It should contain the selected IPFS peer.
      assert.include(result, 'Qm')
    })

    it('should throw error if no service is selected', () => {
      try {
        // Force code path.
        sandbox.stub(uut.conf, 'get').returns(false)

        uut.checkServiceId()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Relayer service ID does not exist in config.')
      }
    })
  })

  describe('#getAbout', () => {
    const mockAboutData = {
      success: true,
      status: 200,
      message:
        '{"@context":"https://schema.org/","@type":"WebAPI","name":"trout-dev-railgun-relay","version":"1.0.1","protocol":"railgun-relayer","description":"This is a generic Railgun Relayer. It has not been customized.","documentation":"https://www.railgun.org/","provider":{"@type":"Organization","name":"Railgun DAO","url":"https://www.railgun.org/"},"identifier":"QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp"}',
      endpoint: 'about'
    }

    it('should get data about the Relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: mockAboutData })

      const result = await uut.getAbout()
      // console.log('result: ', result);

      assert.equal(result.endpoint, 'about')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'checkServiceId').throws(new Error('test error'))

        await uut.getAbout()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw error if Relayer returns error', async () => {
      try {
        // Mock dependencies
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'test failure' } })

        await uut.getAbout()
        // console.log('result: ', result);

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test failure')
      }
    })
  })

  describe('#getRate', () => {
    const mockRateData = {
      success: true,
      status: 200,
      message: 10,
      endpoint: 'rate'
    }

    it('should get the rate from the Relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: mockRateData })

      const result = await uut.getRate()
      // console.log('result: ', result);

      assert.equal(result.endpoint, 'rate')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'checkServiceId').throws(new Error('test error'))

        await uut.getRate()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw error if Relayer returns error', async () => {
      try {
        // Mock dependencies
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'test failure' } })

        await uut.getRate()
        // console.log('result: ', result);

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test failure')
      }
    })
  })

  describe('#submitTx', () => {
    const mockSubmitTxData = {
      success: true,
      status: 200,
      message: 'Hex recieved successfully',
      hex: 'test',
      endpoint: 'submitTx'
    }

    it('should submit tx hex to the Relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: mockSubmitTxData })

      const hex = 'test'
      const result = await uut.submitTx(hex)
      // console.log('result: ', result);

      assert.equal(result.endpoint, 'submitTx')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'checkServiceId').throws(new Error('test error'))

        const hex = 'test'
        await uut.submitTx(hex)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw error if Relayer returns error', async () => {
      try {
        // Mock dependencies
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'test failure' } })

        const hex = 'test'
        await uut.submitTx(hex)
        // console.log('result: ', result);

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test failure')
      }
    })
  })

  describe('#getState', () => {
    const mockStateData = {
      success: true,
      status: 200,
      message: "I'm a little teapot!",
      endpoint: 'getState'
    }

    it('should get the contract state from the Relayer', async () => {
      // Mock dependencies
      sandbox.stub(uut.axios, 'post').resolves({ data: mockStateData })

      const result = await uut.getState()
      // console.log('result: ', result);

      assert.equal(result.endpoint, 'getState')
    })

    it('should catch, report, and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'checkServiceId').throws(new Error('test error'))

        await uut.getState()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.equal(err.message, 'test error')
      }
    })

    it('should throw error if Relayer returns error', async () => {
      try {
        // Mock dependencies
        sandbox
          .stub(uut.axios, 'post')
          .resolves({ data: { success: false, message: 'test failure' } })

        await uut.getState()
        // console.log('result: ', result);

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test failure')
      }
    })
  })
})
