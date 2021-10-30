/*
  This is the JSON RPC router for the submit TX API
*/

// Public npm libraries
const jsonrpc = require("jsonrpc-lite");
const { ethers } = require("ethers");

// Local libraries
const config = require("../../../../config");

class SubmitTxRPC {
  constructor(localConfig) {
    // Encapsulate dependencies
    this.jsonrpc = jsonrpc;
    this.ethers = ethers;

    this.config = config;
    this.whitelist = config.addrWhitelist;

    // Configure wallet
    this.provider = new ethers.providers.JsonRpcProvider(
      "https://rpc.goerli.mudit.blog"
    );
    const privKey = `6664b32c25036dd3b64dc1fcb9505617b85cacd49c5a8006f4bc09dee5e35e48`;
    this.wallet = new ethers.Wallet(privKey, this.provider);
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
    try {
      // console.log("rpcData: ", rpcData);

      const hex = rpcData.payload.params.hex;

      console.log(" ");

      // TODO: This biz logic should go into a use-case. It should not live in
      // this RPC handler.
      // Deserialize the unsigned transaction.
      // This simulates the Relayer recieving the TX.
      const deserializedTx = this.ethers.utils.parseTransaction(hex);
      console.log("deserializedTx: ", deserializedTx);

      console.log("whitelist: ", this.whitelist);

      // Verify that the contract address exists within the whitelist.
      let notInWhitelist = true;
      for (let i = 0; i < this.whitelist.length; i++) {
        const goodAddr = this.whitelist[i];

        if (deserializedTx.to.toLowerCase() === goodAddr.toLowerCase()) {
          notInWhitelist = false;
          break;
        }
      }
      if (notInWhitelist) {
        throw new Error("Contract address is not in whitelist");
      }

      // Circumvent issue with v5 of ethers.js:
      // https://github.com/ethers-io/ethers.js/discussions/2189
      const testTx = {
        data: deserializedTx.data,
        to: deserializedTx.to,
        chainId: deserializedTx.chainId
      };

      // Broadcast the transaction.
      const txInfo = await this.wallet.sendTransaction(testTx);
      console.log("txInfo: ", txInfo);

      return {
        success: true,
        status: 200,
        message: "TX Relayed successfully", // Hard-coded value. TODO: Replace with more biz logic.
        txInfo,
        endpoint: "submitTx"
      };
    } catch (err) {
      return {
        success: false,
        status: 500,
        message: err.message,
        endpoint: "submitTx"
      };
    }
  }
}

module.exports = SubmitTxRPC;
