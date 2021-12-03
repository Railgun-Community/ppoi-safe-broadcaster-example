/*
  Unit tests for the top-level Adapters index.js file
*/

// Public npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const Adapters = require("../../../src/adapters");

describe("#adapters", () => {
  let sandbox, uut;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new Adapters();
  });

  afterEach(() => sandbox.restore());

  describe("#start", () => {
    it("should start async initialization", async () => {
      // Mock dependencies
      sandbox.stub(uut.ipfs, "start").resolves();

      const result = await uut.start();

      assert.equal(result, true);
    });

    it("should log and throw errors", async () => {
      try {
        // Force an error
        sandbox.stub(uut.ipfs, "start").rejects(new Error("test error"));

        await uut.start();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.equal(err.message, "test error");
      }
    });
  });
});
