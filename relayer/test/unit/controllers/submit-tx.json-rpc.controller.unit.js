/*
  Unit tests for the json-rpc/submit-tx/index.js file.
*/

// Public npm libraries
const sinon = require("sinon");
const assert = require("chai").assert;

// Local libraries
const SubmitTxRPC = require("../../../src/controllers/json-rpc/submit-tx");

describe("#SubmitTxRPC", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    uut = new SubmitTxRPC();
  });

  afterEach(() => sandbox.restore());

  describe("#submitTxRouter", () => {
    // it('should acknowledge reciept of a tx', async () => {
    //   const rpcData =
    //
    //   const result = await uut.submitTxRouter(rpcData)
    // })
    //
    // it("should return rate information", async () => {
    //   const result = await uut.rateRouter();
    //   // console.log("result: ", result);
    //
    //   assert.property(result, "success");
    //   assert.equal(result.success, true);
    //   assert.property(result, "status");
    //   assert.equal(result.status, 200);
    //   assert.property(result, "message");
    //   assert.property(result, "endpoint");
    //   assert.equal(result.endpoint, "rate");
    // });
  });
});
