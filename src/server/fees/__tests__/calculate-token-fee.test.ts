import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon, { SinonStub } from 'sinon';
import configTokens from '../../config/config-tokens';
import { Network } from '../../../models/network-models';
import {
  getMockContractTransaction,
  MOCK_TOKEN_6_DECIMALS,
} from '../../../test/mocks.test';
import { setupTestNetwork, testChainEthereum } from '../../../test/setup.test';
import {
  cacheTokenPriceForNetwork,
  resetTokenPriceCache,
  TokenPriceSource,
} from '../../tokens/token-price-cache';
import {
  calculateTokenFeePerUnitGasToken,
  getAllUnitTokenFeesForChain,
  getTokenFee,
} from '../calculate-token-fee';
import * as estimateGasModule from '../gas-estimate';
import {
  getEstimateGasDetailsPublic,
  calculateMaximumGasRelayer,
} from '../gas-estimate';
import { initTokens } from '../../tokens/network-tokens';
import { initNetworkProviders } from '../../providers/active-network-providers';
import {
  EVMGasType,
  getEVMGasTypeForTransaction,
  isDefined,
  NetworkName,
} from '@railgun-community/shared-models';
import { parseEther } from 'ethers';
import { startEngine } from '../../engine/engine-init';
import configNetworks from '../../config/config-networks';

chai.use(chaiAsPromised);
const { expect } = chai;

let estimateMaximumGasStub: SinonStub;
let network: Network;
const chain = testChainEthereum();
const MOCK_TOKEN_ADDRESS = '0x12345';
const MOCK_TRANSACTION = getMockContractTransaction();

const stubEstimateGasDetails = (
  gasEstimate: bigint,
  maxFeePerGas: bigint,
  maxPriorityFeePerGas: bigint,
) => {
  estimateMaximumGasStub = sinon
    .stub(estimateGasModule, 'getEstimateGasDetailsPublic')
    .resolves({
      evmGasType: EVMGasType.Type2,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
};

const setupMocks = (
  tokenAddress: string,
  tokenPrice: number,
  gasTokenPrice: number,
  gasEstimate?: bigint,
  maxFeePerGas?: bigint,
  maxPriorityFeePerGas?: bigint,
) => {
  const gasTokenAddress = network.gasToken.wrappedAddress ?? '';
  cacheTokenPriceForNetwork(TokenPriceSource.CoinGecko, chain, tokenAddress, {
    price: tokenPrice,
    updatedAt: Date.now(),
  });
  cacheTokenPriceForNetwork(
    TokenPriceSource.CoinGecko,
    chain,
    gasTokenAddress,
    {
      price: gasTokenPrice,
      updatedAt: Date.now(),
    },
  );
  if (
    isDefined(gasEstimate) &&
    isDefined(maxFeePerGas) &&
    isDefined(maxPriorityFeePerGas)
  ) {
    stubEstimateGasDetails(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);
  }
};

describe('calculate-token-fee', () => {
  before(async () => {
    startEngine();
    network = setupTestNetwork();
    configNetworks[chain.type][chain.id] = network;
    await initNetworkProviders([chain]);
    // @ts-expect-error
    configTokens[chain.type] ??= {};
    configTokens[chain.type][chain.id] = {
      [MOCK_TOKEN_ADDRESS]: {
        symbol: 'MOCK1',
      },
      [MOCK_TOKEN_6_DECIMALS]: {
        symbol: 'MOCK2',
      },
    };
    await initTokens();
  });

  afterEach(() => {
    resetTokenPriceCache();
    estimateMaximumGasStub?.restore();
  });

  it('Should calculate token fee per unit gas with precision', () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice);

    const maximumGasFeeForToken = calculateTokenFeePerUnitGasToken(
      chain,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('990424892220000000000');
  });

  it('Should calculate token fee per unit gas with different decimal amounts', () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_6_DECIMALS, tokenPrice, gasTokenPrice);

    const maximumGasFeeForToken = calculateTokenFeePerUnitGasToken(
      chain,
      MOCK_TOKEN_6_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('990424892');
  });

  it('Should calculate token fee for transaction with precision', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const gasEstimate = parseEther('0.001');
    const maxFeePerGas = BigInt('90000');
    const maxPriorityFeePerGas = BigInt('10000');
    setupMocks(
      MOCK_TOKEN_ADDRESS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const gasEstimateDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGasRelayer(gasEstimateDetails, chain);
    const maximumGasFeeForToken = getTokenFee(
      chain,
      maximumGas,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal(
      '106965888359760000000000',
    );
  });

  it('Should calculate token fee for transaction with different decimal amounts', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const gasEstimate = parseEther('0.001');
    const maxFeePerGas = BigInt('90000');
    const maxPriorityFeePerGas = BigInt('10000');
    setupMocks(
      MOCK_TOKEN_6_DECIMALS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const gasEstimateDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGasRelayer(gasEstimateDetails, chain);
    const maximumGasFeeForToken = getTokenFee(
      chain,
      maximumGas,
      MOCK_TOKEN_6_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal(
      '106965888359', // (+20% gas limit) (-25% limit to actual ratio)
    );
  });

  it('Should get all unit token fees for chain', () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice);

    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chain);

    expect(fees).to.be.an('object');
    expect(feeCacheID).to.be.a('string');
    expect(fees[MOCK_TOKEN_ADDRESS].toString()).to.equal(
      '990424892220000000000',
    );
  });

  it('Should error when precision not high enough', async () => {
    const tokenPrice = 400000000;
    const gasTokenPrice = 1234.56;
    const gasEstimate = parseEther('0.001');
    const maxFeePerGas = BigInt('90000');
    const maxPriorityFeePerGas = BigInt('10000');
    setupMocks(
      MOCK_TOKEN_ADDRESS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const evmGasType = getEVMGasTypeForTransaction(NetworkName.Ethereum, false);

    const gasEstimateDetails = await getEstimateGasDetailsPublic(
      chain,
      evmGasType,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGasRelayer(gasEstimateDetails, chain);
    expect(() => getTokenFee(chain, maximumGas, MOCK_TOKEN_ADDRESS)).to.throw(
      `Price ratio between token (400000000) and gas token (1234.56)
      is not precise enough to provide an accurate fee.`,
    );
  });
}).timeout(31000);
