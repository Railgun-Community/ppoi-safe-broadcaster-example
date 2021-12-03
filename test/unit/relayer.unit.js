/*
  Unit tests for the top-level relayer.js file
*/

// Public npm libraries
const assert = require("chai").assert;
const sinon = require("sinon");

// Local libraries
const Relayer = require("../../index");

describe("#relayer", () => {
  let sandbox, uut;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new Relayer();
  });

  afterEach(() => sandbox.restore());

  describe("#startRelayer", () => {
    it("should start the relayer daemon", async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters, "start").resolves();
      sandbox.stub(uut.controllers, "attachRPCControllers").resolves();

      const result = await uut.startRelayer();

      assert.equal(result, true);
    });

    it("should catch and report errors", async () => {
      // Force an error
      sandbox.stub(uut.adapters, "start").rejects(new Error("test error"));

      await uut.startRelayer();

      assert.isOk("top-level function should not throw an error");
    });
  });
});
