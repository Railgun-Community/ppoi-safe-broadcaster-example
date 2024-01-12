import { EVMGasType } from '@railgun-community/shared-models';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import * as GasHistoryModule from '../../server/fees/gas-by-speed';
import { FallbackProvider, JsonRpcProvider } from 'ethers';

let estimateGasStub: SinonStub;
let getHistoricalDataStub: SinonStub;
let gasBalanceStub: SinonStub;

export const createGasEstimateStubs = (
  estimateGas: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
) => {
  estimateGasStub = sinon
    .stub(FallbackProvider.prototype, 'estimateGas')
    .resolves(estimateGas);
  getHistoricalDataStub = sinon
    .stub(GasHistoryModule, 'getStandardGasDetails')
    .resolves({
      evmGasType: EVMGasType.Type2,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
};

export const restoreGasEstimateStubs = () => {
  estimateGasStub?.restore();
  getHistoricalDataStub?.restore();
};

export const createGasBalanceStub = (balance: bigint) => {
  gasBalanceStub = sinon
    .stub(JsonRpcProvider.prototype, 'getBalance')
    .resolves(balance);
  gasBalanceStub.calledOnceWithExactly;
};

export const restoreGasBalanceStub = () => {
  gasBalanceStub?.restore();
};
