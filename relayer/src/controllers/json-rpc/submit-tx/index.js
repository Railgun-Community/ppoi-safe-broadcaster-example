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
  async submitTxRouter(rpcData) {
    console.log("rpcData: ", rpcData);

    const hex = rpcData.payload.params.hex;

    // TODO: Add business logic around handling and broadcasting of TX hex.

    return {
      success: true,
      status: 200,
      message: "Hex recieved successfully", // Hard-coded value. TODO: Replace with more biz logic.
      hex,
      endpoint: "submitTx"
    };
  }
}

module.exports = SubmitTxRPC;
