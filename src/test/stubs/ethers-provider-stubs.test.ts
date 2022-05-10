import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';
import { EVMGasType } from '../../models/network-models';
import * as GasHistoryModule from '../../server/fees/gas-history';

let estimateGasStub: SinonStub;
let getHistoricalDataStub: SinonStub;
let gasBalanceStub: SinonStub;

export const createGasEstimateStubs = (
  estimateGas: BigNumber,
  maxFeePerGas: BigNumber,
  maxPriorityFeePerGas: BigNumber,
) => {
  estimateGasStub = sinon
    .stub(BaseProvider.prototype, 'estimateGas')
    .resolves(estimateGas);
  getHistoricalDataStub = sinon
    .stub(GasHistoryModule, 'getStandardHistoricalFeeData')
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

export const createGasBalanceStub = (balance: BigNumber) => {
  gasBalanceStub = sinon
    .stub(BaseProvider.prototype, 'getBalance')
    .resolves(balance);
  gasBalanceStub.calledOnceWithExactly;
};

export const restoreGasBalanceStub = () => {
  gasBalanceStub?.restore();
};
