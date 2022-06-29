import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, utils } from 'ethers';
import sinon, { SinonStub } from 'sinon';
import configTokens from '../../config/config-tokens';
import { EVMGasType, Network } from '../../../models/network-models';
import {
  getMockPopulatedTransaction,
  MOCK_TOKEN_6_DECIMALS,
} from '../../../test/mocks.test';
import { setupTestNetwork, testChainID } from '../../../test/setup.test';
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
import { getEstimateGasDetails, calculateMaximumGas } from '../gas-estimate';
import { initTokens } from '../../tokens/network-tokens';
import { initNetworkProviders } from '../../providers/active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

let estimateMaximumGasStub: SinonStub;
let network: Network;
const chainID = testChainID();
const MOCK_TOKEN_ADDRESS = '0x12345';
const MOCK_TRANSACTION = getMockPopulatedTransaction();

const stubEstimateGasDetails = (
  gasEstimate: BigNumber,
  maxFeePerGas: BigNumber,
  maxPriorityFeePerGas: BigNumber,
) => {
  estimateMaximumGasStub = sinon
    .stub(estimateGasModule, 'getEstimateGasDetails')
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
  gasEstimate?: BigNumber,
  maxFeePerGas?: BigNumber,
  maxPriorityFeePerGas?: BigNumber,
) => {
  const gasTokenAddress = network.gasToken.wrappedAddress ?? '';
  cacheTokenPriceForNetwork(TokenPriceSource.CoinGecko, chainID, tokenAddress, {
    price: tokenPrice,
    updatedAt: Date.now(),
  });
  cacheTokenPriceForNetwork(
    TokenPriceSource.CoinGecko,
    chainID,
    gasTokenAddress,
    {
      price: gasTokenPrice,
      updatedAt: Date.now(),
    },
  );
  if (gasEstimate && maxFeePerGas && maxPriorityFeePerGas) {
    stubEstimateGasDetails(gasEstimate, maxFeePerGas, maxPriorityFeePerGas);
  }
};

describe('calculate-token-fee', () => {
  before(async () => {
    network = setupTestNetwork();
    initNetworkProviders([chainID]);
    configTokens[chainID] = {
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
      chainID,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('1272742268040000000000');
  });

  it('Should calculate token fee per unit gas with different decimal amounts', () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_6_DECIMALS, tokenPrice, gasTokenPrice);

    const maximumGasFeeForToken = calculateTokenFeePerUnitGasToken(
      chainID,
      MOCK_TOKEN_6_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal('1272742268');
  });

  it('Should calculate token fee for transaction with precision', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const gasEstimate = utils.parseEther('0.001');
    const maxFeePerGas = BigNumber.from('90000');
    const maxPriorityFeePerGas = BigNumber.from('10000');
    setupMocks(
      MOCK_TOKEN_ADDRESS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const gasEstimateDetails = await getEstimateGasDetails(
      chainID,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGas(gasEstimateDetails);
    const maximumGasFeeForToken = getTokenFee(
      chainID,
      maximumGas,
      MOCK_TOKEN_ADDRESS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal(
      '127274226804000000000000',
      // '152729072164800000000000', // +20%
    );
  });

  it('Should calculate token fee for transaction with different decimal amounts', async () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    const gasEstimate = utils.parseEther('0.001');
    const maxFeePerGas = BigNumber.from('90000');
    const maxPriorityFeePerGas = BigNumber.from('10000');
    setupMocks(
      MOCK_TOKEN_6_DECIMALS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const gasEstimateDetails = await getEstimateGasDetails(
      chainID,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGas(gasEstimateDetails);
    const maximumGasFeeForToken = getTokenFee(
      chainID,
      maximumGas,
      MOCK_TOKEN_6_DECIMALS,
    );

    expect(maximumGasFeeForToken.toString()).to.equal(
      '127274226804',
      // '152729072164', // +20%
    );
  });

  it('Should get all unit token fees for chain', () => {
    const tokenPrice = 1.067;
    const gasTokenPrice = 1234.56;
    setupMocks(MOCK_TOKEN_ADDRESS, tokenPrice, gasTokenPrice);

    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chainID);

    expect(fees).to.be.an('object');
    expect(feeCacheID).to.be.a('string');
    expect(fees[MOCK_TOKEN_ADDRESS].toString()).to.equal(
      '1272742268040000000000',
    );
  });

  it('Should error when precision not high enough', async () => {
    const tokenPrice = 0.00000106;
    const gasTokenPrice = 1234.56;
    const gasEstimate = utils.parseEther('0.001');
    const maxFeePerGas = BigNumber.from('90000');
    const maxPriorityFeePerGas = BigNumber.from('10000');
    setupMocks(
      MOCK_TOKEN_ADDRESS,
      tokenPrice,
      gasTokenPrice,
      gasEstimate,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    const gasEstimateDetails = await getEstimateGasDetails(
      chainID,
      MOCK_TRANSACTION,
    );
    const maximumGas = calculateMaximumGas(gasEstimateDetails);
    expect(() =>
      getTokenFee(chainID, maximumGas, MOCK_TOKEN_ADDRESS),
    ).to.throw();
  });
}).timeout(10000);
