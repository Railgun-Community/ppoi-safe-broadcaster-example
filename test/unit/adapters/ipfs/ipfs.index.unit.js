/*
  Unit tests for the top-level IPFS index.js file
*/

// Public npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const IPFSLib = require("../../../../src/adapters/ipfs");
const IPFSMock = require("./mocks/ipfs-mock");
const IPFSCoordMock = require("./mocks/ipfs-coord-mock");
const IPFSPinnerMock = require("./mocks/ipfs-pinner-mock");

describe("#IPFS-adapter-index", () => {
  let sandbox, uut;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new IPFSLib();
  });

  afterEach(() => sandbox.restore());

  describe("#start", () => {
    it("should return a promise that resolves into an instance of IPFS.", async () => {
      // Mock dependencies.
      uut.ipfsAdapter = new IPFSMock();
      uut.IpfsCoordAdapter = IPFSCoordMock;
      uut.IpfsPinnerAdapter = IPFSPinnerMock;

      const result = await uut.start();

      assert.equal(result, true);
    });

    it("should catch and throw an error", async () => {
      try {
        // Force an error
        sandbox.stub(uut.ipfsAdapter, "start").rejects(new Error("test error"));

        await uut.start();

        assert.fail("Unexpected code path.");
      } catch (err) {
        // console.log(err)
        assert.include(err.message, "test error");
      }
    });

    it("should handle lock-file errors", async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.ipfsAdapter, "start")
          .rejects(new Error("Lock already being held"));

        // Prevent process from exiting
        sandbox.stub(uut.process, "exit").returns();

        await uut.start();

        assert.fail("Unexpected code path.");
      } catch (err) {
        assert.include(err.message, "Lock already being held");
      }
    });
  });
});
