/*
  Unit tests for the json-rpc/index.js library.
*/

// Public npm libraries
const assert = require("chai").assert;
const jsonrpc = require("jsonrpc-lite");
const sinon = require("sinon");
const { v4: uid } = require("uuid");

// Set the environment variable to signal this is a test.
// process.env.SVC_ENV = 'test'

// Local libraries.
const JSONRPC = require("../../../src/controllers/json-rpc");
const adapters = require("../mocks/adapters");

describe("#JSON RPC", () => {
  let uut;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // const useCases = new UseCasesMock()
    uut = new JSONRPC({ adapters });
  });

  afterEach(() => sandbox.restore());

  describe("#constructor", () => {
    it("should throw an error if adapters are not passed in", () => {
      try {
        uut = new JSONRPC();

        assert.fail("Unexpected code path");
      } catch (err) {
        assert.include(
          err.message,
          "Instance of Adapters library required when instantiating JSON RPC Controllers."
        );
      }
    });
  });

  describe("#router", () => {
    it("should exit quietly if given a random string", async () => {
      const str = "random string message";
      await uut.router(str);

      assert.isOk("Not throwing an error is a pass.");
    });

    it("should exit quietly if invalid JSON RPC message received", async () => {
      const malformedRpc = '{"jsonrpc":"2.0"}';

      await uut.router(malformedRpc, "peerA");

      assert.isOk("Not throwing an error is a pass.");
    });

    it("should return default response if routing is not possible", async () => {
      const id = uid();
      const json = jsonrpc.request(id, "unknownMethod", {});

      const str = JSON.stringify(json);

      const result = await uut.router(str, "peerA");
      // console.log('result: ', result)

      const jsonObj = jsonrpc.parse(result.retStr);
      // console.log(`jsonObj: ${JSON.stringify(jsonObj, null, 2)}`)

      // Assert the expected properties exist on the returned object.
      assert.property(jsonObj, "payload");
      assert.property(jsonObj, "type");
      assert.property(jsonObj.payload, "jsonrpc");
      assert.property(jsonObj.payload, "id");
      assert.property(jsonObj.payload, "result");
      assert.property(jsonObj.payload.result, "reciever");
      assert.property(jsonObj.payload.result.value, "success");
      assert.property(jsonObj.payload.result.value, "message");

      // Assert the expected values exist.
      assert.equal(jsonObj.payload.id, id);
      assert.equal(jsonObj.payload.result.value.success, false);
      assert.equal(jsonObj.payload.result.value.status, 422);
      assert.equal(
        jsonObj.payload.result.value.message,
        "Input does not match routing rules."
      );
    });

    it("should catch and handle errors", async () => {
      // Force an error
      sandbox.stub(uut.jsonrpc, "parse").throws(new Error("test error"));

      const malformedRpc = '{"jsonrpc":"2.0"}';

      await uut.router(malformedRpc, "peerA");

      assert.isOk("Not throwing an error is a pass.");
    });

    it("should route to about handler", async () => {
      const id = uid();
      const userCall = jsonrpc.request(id, "about", { endpoint: "getAll" });
      const jsonStr = JSON.stringify(userCall, null, 2);

      // Mock the controller.
      sandbox.stub(uut.aboutController, "aboutRouter").resolves("true");

      // Force ipfs-coord communication.
      uut.ipfsCoord.ipfs = {
        orbitdb: {
          sendToDb: () => {}
        }
      };

      const result = await uut.router(jsonStr, "peerA");
      // console.log(result)

      const obj = JSON.parse(result.retStr);
      // console.log('obj: ', obj)

      assert.equal(obj.result.value, "true");
      assert.equal(obj.result.method, "about");
      assert.equal(obj.id, id);
    });

    it("should exit quietly for duplicate RPC message", async () => {
      const id = uid();
      const json = jsonrpc.request(id, "unknownMethod", {});

      const str = JSON.stringify(json);

      // Call router once.
      await uut.router(str, "peerA");

      // Call the router again with the same input.
      const result = await uut.router(str, "peerA");

      assert.equal(result, false);
    });

    it("should ignore metric queries from ipfs-coord", async () => {
      const id = uid();
      const json = jsonrpc.request(id, "unknownMethod", {});

      const str = JSON.stringify(json);

      // Force the RPC type to be 'success', to indicate an RPC that was
      // processed internal to ipfs-coord.
      sandbox.stub(uut.jsonrpc, "parse").returns({
        payload: {},
        type: "success"
      });

      // Call the router again with the same input.
      const result = await uut.router(str, "peerA");

      assert.equal(result, false);
    });

    it("should report errors when trying to send messages to peers", async () => {
      const id = uid();
      const json = jsonrpc.request(id, "unknownMethod", {});

      const str = JSON.stringify(json);

      // Force issue with sendPrivateMessage()
      sandbox
        .stub(uut.ipfsCoord.useCases.peer, "sendPrivateMessage")
        .rejects("test error");

      // Call the router again with the same input.
      const result = await uut.router(str, "peerA");
      // console.log('result: ', result)

      assert.property(result, "from");
      assert.property(result, "retStr");
    });
  });

  describe("#_checkIfAlreadyProcessed", () => {
    it("should return false the first time an RPC command is seen", () => {
      const data = {
        payload: {
          jsonrpc: "2.0",
          id: "6c515f3c-cf8a-42ec-870e-e416edd4923f",
          method: "unknownMethod",
          params: {}
        },
        type: "request"
      };

      const result = uut._checkIfAlreadyProcessed(data);

      assert.equal(result, false);
    });

    it("should return true the second time an RPC command is seen", () => {
      const data = {
        payload: {
          jsonrpc: "2.0",
          id: "6c515f3c-cf8a-42ec-870e-e416edd4923f",
          method: "unknownMethod",
          params: {}
        },
        type: "request"
      };

      // First call.
      uut._checkIfAlreadyProcessed(data);

      // Second call.
      const result = uut._checkIfAlreadyProcessed(data);

      assert.equal(result, true);
    });

    it("should push out old data from the cache for new data", () => {
      const data = {
        payload: {
          jsonrpc: "2.0",
          id: "6c515f3c-cf8a-42ec-870e-e416edd4923f",
          method: "unknownMethod",
          params: {}
        },
        type: "request"
      };

      uut.MSG_CACHE_SIZE = 0;

      const result = uut._checkIfAlreadyProcessed(data);

      assert.equal(result, false);
    });

    it("should return true on error", () => {
      const result = uut._checkIfAlreadyProcessed();

      assert.equal(result, true);
    });
  });
});
