/*
  Unit tests for the IPFS Adapter.
*/

const assert = require("chai").assert;
const sinon = require("sinon");

const IPFSCoordAdapter = require("../../../../src/adapters/ipfs/ipfs-coord");
const IPFSMock = require("./mocks/ipfs-mock");
const IPFSCoordMock = require("./mocks/ipfs-coord-mock");

describe("#IPFS", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    const ipfs = IPFSMock.create();
    uut = new IPFSCoordAdapter({ ipfs });

    sandbox = sinon.createSandbox();
  });

  afterEach(() => sandbox.restore());

  describe("#constructor", () => {
    it("should throw an error if ipfs instance is not included", () => {
      try {
        uut = new IPFSCoordAdapter();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "Instance of IPFS must be passed when instantiating ipfs-coord."
        );
      }
    });
  });

  describe("#start", () => {
    it("should return a promise that resolves into an instance of IPFS.", async () => {
      // Mock dependencies.
      uut.IpfsCoord = IPFSCoordMock;

      const result = await uut.start();
      // console.log('result: ', result)

      assert.equal(result, true);
    });

    it("should get the public IP address if this node is a Circuit Relay", async () => {
      // Mock dependencies.
      uut.IpfsCoord = IPFSCoordMock;
      sandbox.stub(uut.publicIp, "v4").returns("123");

      // Force Circuit Relay
      uut.config.isCircuitRelay = true;

      const result = await uut.start();
      // console.log('result: ', result)

      assert.equal(result, true);
    });
  });

  describe("#attachRPCRouter", () => {
    it("should attached a router output", async () => {
      // Mock dependencies
      uut.ipfsCoord = {
        privateLog: {},
        ipfs: {
          orbitdb: {
            privateLog: {}
          }
        },
        adapters: {
          orbit: {
            privateLog: () => {}
          }
        }
      };

      const router = console.log;

      uut.attachRPCRouter(router);
    });

    it("should catch and throw an error", () => {
      try {
        // Force an error
        delete uut.ipfsCoord.adapters;

        const router = console.log;

        uut.attachRPCRouter(router);

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(err.message, "Cannot read property");
      }
    });
  });
});
