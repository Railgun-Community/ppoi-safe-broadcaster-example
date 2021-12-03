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
    it("should acknowledge reciept of a tx", async () => {
      // Mock dependencies
      // sandbox.stub(uut.ethers.utils, "parseTransaction").resolves(testHex);
      sandbox
        .stub(uut.wallet, "sendTransaction")
        .resolves({ hash: "test-hash" });

      const result = await uut.submitTxRouter(mockRpcData);
      console.log("result: ", result);

      // Assert expected properties and values exist.
      assert.property(result, "success");
      assert.equal(result.success, true);
      assert.property(result, "status");
      assert.equal(result.status, 200);
      assert.property(result, "message");
      assert.property(result, "txInfo");
      assert.property(result, "endpoint");
      assert.equal(result.endpoint, "submitTx");
    });
  });
});

const mockRpcData = {
  payload: {
    jsonrpc: "2.0",
    id: "46ebe70e-4b95-4c11-abc2-a4a9edc56c2b",
    method: "submitTx",
    params: {
      hex:
        "0xe18080809478d3bcdd9ae4b5f26bd60cd8014412528f68a4a78084d09de08a058080"
    }
  },
  type: "request",
  from: "QmUpc6JVSiCrm4gZkQGDTTKn9g5uGzc25HAEs9qqShw8Rs"
};
