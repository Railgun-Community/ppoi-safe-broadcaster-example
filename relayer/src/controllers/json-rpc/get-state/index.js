/*
  This is the JSON RPC router for the rate API
*/

// Public npm libraries
const jsonrpc = require("jsonrpc-lite");

// Local libraries
const config = require("../../../../config");

class GetStateRPC {
  constructor(localConfig) {
    // Encapsulate dependencies
    this.jsonrpc = jsonrpc;
  }

  /**
   * @api {JSON} /getState Contract State
   * @apiPermission public
   * @apiName Get State
   * @apiGroup JSON Get State
   *
   * @apiExample Example usage:
   * {"jsonrpc":"2.0","id":"555","method":"getState"}
   *
   * @apiDescription
   * This endpoint returns the state of a smart contract, given the TXID from
   * interacting with it.
   */

  async getStateRouter(rpcData) {
    return {
      success: true,
      status: 200,
      message: "I'm a little teapot!", // Hard-coded value. TODO: Replace with more biz logic.
      endpoint: "getState"
    };
  }
}

module.exports = GetStateRPC;
