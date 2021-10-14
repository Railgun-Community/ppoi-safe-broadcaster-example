/*
  Unit tests for the json-rpc/rate/index.js file.
*/

// Public npm libraries
const sinon = require("sinon");
const assert = require("chai").assert;

// Local libraries
const RateRPC = require("../../../src/controllers/json-rpc/rate");

describe("#RateRPC", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new RateRPC();
  });

  afterEach(() => sandbox.restore());

  describe("#rateRouter", () => {
    it("should return rate information", async () => {
      const result = await uut.rateRouter();
      // console.log("result: ", result);

      assert.property(result, "success");
      assert.equal(result.success, true);
      assert.property(result, "status");
      assert.equal(result.status, 200);
      assert.property(result, "message");
      assert.property(result, "endpoint");
      assert.equal(result.endpoint, "rate");
    });
  });
});
