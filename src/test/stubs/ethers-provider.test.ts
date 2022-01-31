import { BaseProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import sinon, { SinonStub } from 'sinon';

let estimateGasStub: SinonStub;
let getGasPriceStub: SinonStub;

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
