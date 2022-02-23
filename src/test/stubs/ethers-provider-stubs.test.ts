import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
// eslint-disable-next-line import/no-extraneous-dependencies
import sinon, { SinonStub } from 'sinon';

let estimateGasStub: SinonStub;
let getGasPriceStub: SinonStub;
let gasBalanceStub: SinonStub;

export const createGasEstimateStubs = (
  estimateGas: BigNumber,
  getGasPrice: BigNumber,
) => {
  estimateGasStub = sinon
    .stub(BaseProvider.prototype, 'estimateGas')
    .resolves(estimateGas);
  getGasPriceStub = sinon
    .stub(BaseProvider.prototype, 'getGasPrice')
    .resolves(getGasPrice);
};

export const restoreGasEstimateStubs = () => {
  estimateGasStub?.restore();
  getGasPriceStub?.restore();
};

export const createGasBalanceStub = (balance: BigNumber) => {
  gasBalanceStub = sinon
    .stub(BaseProvider.prototype, 'getBalance')
    .resolves(balance);
};

export const restoreGasBalanceStub = () => {
  gasBalanceStub?.restore();
};
