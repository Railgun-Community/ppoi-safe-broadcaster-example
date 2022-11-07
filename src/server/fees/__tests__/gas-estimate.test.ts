import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { getEstimateGasDetails, calculateMaximumGas } from '../gas-estimate';
import {
  getMockNetwork,
  getMockPopulatedTransaction,
} from '../../../test/mocks.test';
import {
  createGasEstimateStubs,
  restoreGasEstimateStubs,
} from '../../../test/stubs/ethers-provider-stubs.test';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { testChainEthereum } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();

describe('gas-estimate', () => {
  before(() => {
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    initNetworkProviders();
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  it('Should calculate maximum gas based on gas estimate', async () => {
    const gasEstimate = BigNumber.from(1000);
    const maxFeePerGas = BigNumber.from(90);
    const maxPriorityFeePerGas = BigNumber.from(10);
    createGasEstimateStubs(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);

    const estimateGasDetails = await getEstimateGasDetails(
      MOCK_CHAIN,
      undefined, // minGasPrice
      getMockPopulatedTransaction(),
    );
    const maximumGas = calculateMaximumGas(estimateGasDetails);

    // (Gas estimate + 20%) * gas price.
    // expect(maximumGas.toNumber()).to.equal(120000);

    expect(maximumGas.toNumber()).to.equal(90000);
  });
}).timeout(10000);
