import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  getEstimateGasDetailsPublic,
  calculateMaximumGasBroadcaster,
} from '../gas-estimate';
import {
  getMockNetwork,
  getMockContractTransaction,
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
    configNetworks[MOCK_CHAIN.type][MOCK_CHAIN.id] = getMockNetwork();
    await initNetworkProviders([MOCK_CHAIN]);
  });

  afterEach(() => {
    restoreGasEstimateStubs();
  });

  it('Should calculate maximum gas based on gas estimate', async () => {
    const gasEstimate = 1000n;
    const maxFeePerGas = 100n;
    const maxPriorityFeePerGas = 10n;
    createGasEstimateStubs(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsPublic(
      MOCK_CHAIN,
      evmGasType,
      getMockContractTransaction(),
    );
    const maximumGas = calculateMaximumGasBroadcaster(
      estimateGasDetails,
      MOCK_CHAIN,
    );

    // (Gas estimate + 20%) * gas price (maxFeePerGas).
    expect(maximumGas).to.equal(120000n);
  });

  it('Should calculate maximum gas based on gas estimate with minGasPrice', async () => {
    const gasEstimate = 1000n;
    const minGasPrice = 100n;
    createGasEstimateStubs(
      gasEstimate,
      minGasPrice, // unused
      minGasPrice, // unused
    );

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const estimateGasDetails = await getEstimateGasDetailsPublic(
      MOCK_CHAIN,
      evmGasType,
      getMockContractTransaction(),
    );
    const maximumGas = calculateMaximumGasBroadcaster(
      estimateGasDetails,
      MOCK_CHAIN,
    );

    // 20% added by gasLimit.
    expect(maximumGas).to.equal(120000n);
  });
}).timeout(120000);
