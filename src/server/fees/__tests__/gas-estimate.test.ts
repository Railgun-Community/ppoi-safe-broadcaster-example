import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from '@ethersproject/bignumber';
import {
  getEstimateGasDetailsPublic,
  calculateMaximumGasRelayer,
} from '../gas-estimate';
import {
  getMockEthereumNetwork,
  getMockPopulatedTransaction,
} from '../../../test/mocks.test';
import {
  createGasEstimateStubs,
  restoreGasEstimateStubs,
} from '../../../test/stubs/ethers-provider-stubs.test';
import configNetworks from '../../config/config-networks';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { testChainEthereum } from '../../../test/setup.test';
import {
  getEVMGasTypeForTransaction,
  NetworkName,
} from '@railgun-community/shared-models';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_CHAIN = testChainEthereum();

describe('gas-estimate', () => {
  before(async () => {
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockEthereumNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  it('Should calculate maximum gas based on gas estimate', async () => {
    const gasEstimate = BigNumber.from(1000);
    const maxFeePerGas = BigNumber.from(100);
    const maxPriorityFeePerGas = BigNumber.from(10);
    createGasEstimateStubs(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsPublic(
      MOCK_CHAIN,
      evmGasType,
      getMockPopulatedTransaction(),
    );
    const maximumGas = calculateMaximumGasRelayer(
      estimateGasDetails,
      MOCK_CHAIN,
    );

    // (Gas estimate + 20%) * gas price (maxFeePerGas).
    expect(maximumGas.toNumber()).to.equal(120000);
  });

  it('Should calculate maximum gas based on gas estimate with minGasPrice', async () => {
    const gasEstimate = BigNumber.from(1000);
    const minGasPrice = BigNumber.from(100);
    createGasEstimateStubs(
      gasEstimate,
      minGasPrice, // unused
      minGasPrice, // unused
    );

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsPublic(
      MOCK_CHAIN,
      evmGasType,
      getMockPopulatedTransaction(),
    );
    const maximumGas = calculateMaximumGasRelayer(
      estimateGasDetails,
      MOCK_CHAIN,
    );

    // 20% added by gasLimit.
    expect(maximumGas.toNumber()).to.equal(120000);
  });
}).timeout(10000);
