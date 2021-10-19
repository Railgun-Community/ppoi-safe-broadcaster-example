/*
  This is the JSON RPC router for the submit TX API
*/

// Public npm libraries
const jsonrpc = require("jsonrpc-lite");

// Local libraries
const config = require("../../../../config");

class SubmitTxRPC {
  constructor(localConfig) {
    // Encapsulate dependencies
    this.jsonrpc = jsonrpc;
  }

  /**
   * @api {JSON} /submitTx Submit TX
   * @apiPermission public
   * @apiName SubmitTx
   * @apiGroup JSON SubmitTx
   *
   * @apiExample Example usage:
   * {"jsonrpc":"2.0","id":"555","method":"submitTx","value": {"txHash": "<hex>"}}
   *
   * @apiDescription
   * This endpoint accepts a hexidecimal string representation of a transaction,
   * and relays that transaction to the blockchain.
   */

  // Currently the 'method' property is not included because there is only one
  // response. If this function needs more resolution, additional methods
  // like GET, POST, PUT can be implemented.
  async submitTxRouter(rpcData) {
    console.log("rpcData: ", rpcData);

    return {
      success: true,
      status: 200,
      message: 10, // Hard-coded value. TODO: Replace with more biz logic.
      endpoint: "submitTx"
    };
  }
}

module.exports = SubmitTxRPC;
