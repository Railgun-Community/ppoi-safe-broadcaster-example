/*
  Unit tests for the json-rpc/get-state/index.js file.
*/

// Public npm libraries
const sinon = require("sinon");
const assert = require("chai").assert;

// Local libraries
const GetStateRPC = require("../../../src/controllers/json-rpc/get-state");

describe("#GetStateRPC", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new GetStateRPC();
  });

  afterEach(() => sandbox.restore());

  describe("#getStateRouter", () => {
    it("should return state information", async () => {
      const result = await uut.getStateRouter();
      // console.log("result: ", result);

      assert.property(result, "success");
      assert.equal(result.success, true);
      assert.property(result, "status");
      assert.equal(result.status, 200);
      assert.property(result, "message");
      assert.property(result, "endpoint");
      assert.equal(result.endpoint, "getState");
    });
  });
});
