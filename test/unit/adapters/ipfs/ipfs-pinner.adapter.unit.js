/*
  Unit tests for the IPFS Adapter.
*/

const { CID } = require('@chris.troutner/ipfs');
const { expect, assert } = require("chai");
const sinon = require("sinon");

const IPFSPinnerAdapter = require("../../../../src/adapters/ipfs/ipfs-pinner");
const IPFSMock = require("./mocks/ipfs-mock");
const IPFSPinnerMock = require("./mocks/ipfs-pinner-mock");

describe("#IPFS", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    const ipfs = IPFSMock.create();
    uut = new IPFSPinnerAdapter({ ipfs });

    sandbox = sinon.createSandbox();
  });

  afterEach(() => sandbox.restore());

  describe("#constructor", () => {
    it("should throw an error if ipfs instance is not included", () => {
      try {
        uut = new IPFSPinnerAdapter();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "Instance of IPFS must be passed when instantiating ipfs-pinner."
        );
      }
    });
  });

  describe("#start", () => {
    it("should return a promise that resolves to true.", async () => {
      // Mock dependencies.
      uut.IpfsPinner = IPFSPinnerMock;

      const result = await uut.start();

      assert.equal(result, true);
    });
  });

  describe("#addPins", () => {
    it("should pin an array of cids", async () => {
      // Mock dependencies
      const cid = 'QmdZvJyYSBmo6XWfK7tDohk4R1vcEnsZ6LHr5Mh33jJVAu';
      uut.pins = [cid];
      await uut.addPins();
      expect(uut.pinned).to.eql([cid]);
    });

  });
});
