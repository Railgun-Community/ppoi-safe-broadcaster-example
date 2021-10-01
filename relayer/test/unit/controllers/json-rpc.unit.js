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

  // describe('#router', () => {
  //   it('should exit quietly if given a random string', async () => {
  //     const str = 'random string message'
  //     await uut.router(str)
  //
  //     assert.isOk('Not throwing an error is a pass.')
  //   })
  //
  //   it('should exit quietly if invalid JSON RPC message received', async () => {
  //     const malformedRpc = '{"jsonrpc":"2.0"}'
  //
  //     await uut.router(malformedRpc, 'peerA')
  //
  //     assert.isOk('Not throwing an error is a pass.')
  //   })
  //
  //   it('should return default response if routing is not possible', async () => {
  //     const id = uid()
  //     const json = jsonrpc.request(id, 'unknownMethod', {})
  //
  //     const str = JSON.stringify(json)
  //
  //     const result = await uut.router(str, 'peerA')
  //     // console.log('result: ', result)
  //
  //     const jsonObj = jsonrpc.parse(result.retStr)
  //     // console.log(`jsonObj: ${JSON.stringify(jsonObj, null, 2)}`)
  //
  //     // Assert the expected properties exist on the returned object.
  //     assert.property(jsonObj, 'payload')
  //     assert.property(jsonObj, 'type')
  //     assert.property(jsonObj.payload, 'jsonrpc')
  //     assert.property(jsonObj.payload, 'id')
  //     assert.property(jsonObj.payload, 'result')
  //     assert.property(jsonObj.payload.result, 'reciever')
  //     assert.property(jsonObj.payload.result.value, 'success')
  //     assert.property(jsonObj.payload.result.value, 'message')
  //
  //     // Assert the expected values exist.
  //     assert.equal(jsonObj.payload.id, id)
  //     assert.equal(jsonObj.payload.result.value.success, false)
  //     assert.equal(jsonObj.payload.result.value.status, 422)
  //     assert.equal(
  //       jsonObj.payload.result.value.message,
  //       'Input does not match routing rules.'
  //     )
  //   })
  //
  //   it('should catch and handle errors', async () => {
  //     // Force an error
  //     sandbox.stub(uut.jsonrpc, 'parse').throws(new Error('test error'))
  //
  //     const malformedRpc = '{"jsonrpc":"2.0"}'
  //
  //     await uut.router(malformedRpc, 'peerA')
  //
  //     assert.isOk('Not throwing an error is a pass.')
  //   })
  //
  //   it('should route to users handler', async () => {
  //     const id = uid()
  //     const userCall = jsonrpc.request(id, 'users', { endpoint: 'getAll' })
  //     const jsonStr = JSON.stringify(userCall, null, 2)
  //
  //     // Mock the users controller.
  //     sandbox.stub(uut.userController, 'userRouter').resolves('true')
  //
  //     const result = await uut.router(jsonStr, 'peerA')
  //     // console.log(result)
  //
  //     const obj = JSON.parse(result.retStr)
  //     // console.log('obj: ', obj)
  //
  //     assert.equal(obj.result.value, 'true')
  //     assert.equal(obj.result.method, 'users')
  //     assert.equal(obj.id, id)
  //   })
  //
  //   it('should route to auth handler', async () => {
  //     const id = uid()
  //     const userCall = jsonrpc.request(id, 'auth', { endpoint: 'getAll' })
  //     const jsonStr = JSON.stringify(userCall, null, 2)
  //
  //     // Mock the controller.
  //     sandbox.stub(uut.authController, 'authRouter').resolves('true')
  //
  //     const result = await uut.router(jsonStr, 'peerA')
  //     // console.log(result)
  //
  //     const obj = JSON.parse(result.retStr)
  //     // console.log('obj: ', obj)
  //
  //     assert.equal(obj.result.value, 'true')
  //     assert.equal(obj.result.method, 'auth')
  //     assert.equal(obj.id, id)
  //   })
  //
  //   it('should route to about handler', async () => {
  //     const id = uid()
  //     const userCall = jsonrpc.request(id, 'about', { endpoint: 'getAll' })
  //     const jsonStr = JSON.stringify(userCall, null, 2)
  //
  //     // Mock the controller.
  //     sandbox.stub(uut.aboutController, 'aboutRouter').resolves('true')
  //
  //     // Force ipfs-coord communication.
  //     uut.ipfsCoord.ipfs = {
  //       orbitdb: {
  //         sendToDb: () => {}
  //       }
  //     }
  //
  //     const result = await uut.router(jsonStr, 'peerA')
  //     // console.log(result)
  //
  //     const obj = JSON.parse(result.retStr)
  //     // console.log('obj: ', obj)
  //
  //     assert.equal(obj.result.value, 'true')
  //     assert.equal(obj.result.method, 'about')
  //     assert.equal(obj.id, id)
  //   })
  // })
});
