/*
  Unit tests for the railgun-about command.
*/

// Public npm packages.
const { assert } = require('chai');
const sinon = require('sinon');

// Local libraries
const RailgunService = require('../../../src/commands/railgun-service');
// const RelaysMock = require('../../mocks/ipfs-relays-mock');

describe('#railgun-about', () => {
  let sandbox;
  let uut;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    uut = new RailgunService();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#selectService', () => {
    it('should select a service and return true', () => {
      // Mock dependencies so real config is not changed.
      sandbox.stub(uut.conf, 'set').returns();

      const flags = {
        select: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
      };

      const result = uut.selectService(mockPeers, flags);
      // console.log('result: ', result);

      assert.equal(result, true);
    });

    it('should return false if service can not be found', () => {
      // Mock dependencies so real config is not changed.
      sandbox.stub(uut.conf, 'set').returns();

      const flags = {
        select: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKo',
      };

      const result = uut.selectService(mockPeers, flags);
      // console.log('result: ', result);

      assert.equal(result, false);
    });

    it('should catch and throw errors', () => {
      try {
        uut.selectService();

        assert.fail('Unexpected code path');
      } catch (err) {
        // console.log(err);
        assert.include(err.message, 'Cannot read property');
      }
    });
  });
});

const mockPeers = [
  {
    addr: '/ip4/143.198.60.119/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    peer: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    direction: 'outbound',
    name: 'trout-dev-railgun-relay',
    protocol: 'railgun-relayer',
    version: '1.0.1',
  },
  {
    addr: '/ip4/139.162.76.54/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    peer: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    direction: 'outbound',
    name: 'ipfs-relay-tokyo-pfs-0945772',
    protocol: 'generic-service',
    version: '1.3.0',
  },
];
