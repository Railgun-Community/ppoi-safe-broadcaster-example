/*
  This is the JSON RPC router for the rate API
*/

// Public npm libraries
const jsonrpc = require("jsonrpc-lite");

// Local libraries
const config = require("../../../../config");

class RateRPC {
  constructor(localConfig) {
    // Encapsulate dependencies
    this.jsonrpc = jsonrpc;
    this.feeLib = localConfig.useCases.fee;
  }

  /**
   * @api {JSON} /rate Relayer Rate
   * @apiPermission public
   * @apiName Rate
   * @apiGroup JSON Rate
   *
   * @apiExample Example usage:
   * {"jsonrpc":"2.0","id":"555","method":"rate"}
   *
   * @apiDescription
   * This endpoint returns the rate that the Railgun Relayer node charges to
   * relay transactions to the Ethereum network.
   */

  // Currently the 'method' property is not included because there is only one
  // response. If this function needs more resolution, additional methods
  // like GET, POST, PUT can be implemented.
  async rateRouter(rpcData) {
    return {
      success: true,
      status: 200,
      message: this.feeLib.getFee(),
      endpoint: "rate"
    };
  }
}

module.exports = RateRPC;
