export enum UniswapProtocolType {
  V2 = "V2",
  V3 = "V3",
  MIXED = "MIXED"
}

export type UniswapQuoteParamConfig = {
  protocols: UniswapProtocolType[],
  enableUniversalRouter: boolean,
  routingType: string,
  recipient: string,
  enableFeeOnTransferFeeFetching: boolean,
}

export type UniswapQuoteParams = {
  tokenInChainId: number,
  tokenIn: string,
  tokenOutChainId: number,
  tokenOut: string,
  amount: string,
  slippage: number,
  sendPortionEnabled: boolean,
  type: string,
  configs: UniswapQuoteParamConfig[]
}

export interface UniswapQuoteInputs {
  slippage: number;
  tokenInAmount: string;
  tokenInAddress: string;
  tokenOutAddress: string;
}

export interface UniswapContractCall {
  calldata: string,
  value: string,
  to: string,
}

export interface UniswapQuoteData {
  methodParameters: UniswapContractCall,
  blockNumber: string,
  amount: string,
  amountDecimals: string, // this is the human readable display value
  quote: string,
  quoteDecimals: string // this is human readable display value
}

export interface UniswapQuoteResponse {
  routing: string,
  quote: UniswapQuoteData
}
