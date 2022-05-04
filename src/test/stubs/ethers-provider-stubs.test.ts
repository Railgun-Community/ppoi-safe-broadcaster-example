import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';

let estimateGasStub: SinonStub;
let getFeeDataStub: SinonStub;
let gasBalanceStub: SinonStub;

export const createGasEstimateStubs = (
  estimateGas: BigNumber,
  maxFeePerGas: BigNumber,
  maxPriorityFeePerGas: BigNumber,
) => {
  estimateGasStub = sinon
    .stub(BaseProvider.prototype, 'estimateGas')
    .resolves(estimateGas);
  getFeeDataStub = sinon.stub(BaseProvider.prototype, 'getFeeData').resolves({
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice: null,
  });
};

export const restoreGasEstimateStubs = () => {
  estimateGasStub?.restore();
  getFeeDataStub?.restore();
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
