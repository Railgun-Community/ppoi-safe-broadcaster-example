import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  setupSingleTestWallet,
  testChainHardhat,
} from '../../../test/setup.test';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { initContracts } from '../../contracts/init-contracts';
import {
  convertTransactionStructToCommitmentSummary,
  getRailgunWalletAddressData,
  hexlify,
} from '@railgun-community/quickstart';
import { RelayerRawParamsPreAuthorize } from '@railgun-community/shared-models';
import {
  MOCK_BOUND_PARAMS,
  MOCK_COMMITMENT_HASH,
  MOCK_RELAYER_FEE_TOKEN_ADDRESS,
  getJsonRPCProviderHardhat,
  getMockHardhatNetwork,
  mockTokenConfig,
} from '../../../test/mocks.test';
import { getRelayerVersion } from '../../../util/relayer-version';
import {
  getActiveWallets,
  getRailgunWalletAddress,
} from '../../wallets/active-wallets';
import { preAuthorizeRequest } from '../pre-authorization';
import { ContractStore } from '../../contracts/contract-store';
import {
  cacheTokenPriceForNetwork,
  TokenPriceSource,
} from '../../tokens/token-price-cache';
import { NetworkChainID } from '../../config/config-chains';
import configDefaults from '../../config/config-defaults';
import configNetworks from '../../config/config-networks';
import { startEngine } from '../../engine/engine-init';
import { initTokens } from '../../tokens/network-tokens';
import { Network } from '../../../models/network-models';
import { verifyTypedData } from '@ethersproject/wallet';
import {
  PaymasterWallet,
  TYPES_PAYMASTER_PRE_AUTHORIZE,
} from '../../wallets/paymaster-wallet';
import { resetPaymasterGasBalanceCache } from '../../balances/paymaster-gas-balance-cache';
import { JsonRpcProvider } from '@ethersproject/providers';
import { depositToPaymaster } from '../paymaster-deposit-withdraw';
import { parseEther } from '@ethersproject/units';

chai.use(chaiAsPromised);
const { expect } = chai;

// TODO: Change to ethereum once paymaster is deployed.
const chain = testChainHardhat();

let networkHardhat: Network;
let snapshot: number;
let provider: JsonRpcProvider;

describe.only('pre-authorization', () => {
  before(async () => {
    configDefaults.networks.EVM.push(NetworkChainID.Hardhat);
    configDefaults.transactionFees.feeExpirationInMS = 5 * 60 * 1000;
    startEngine();
    await setupSingleTestWallet();
    configNetworks[chain.type][chain.id] = getMockHardhatNetwork();
    networkHardhat = configNetworks[chain.type][chain.id];
    mockTokenConfig(chain, MOCK_RELAYER_FEE_TOKEN_ADDRESS);
    await initNetworkProviders([chain]);
    await initTokens();
    initContracts([chain]);
    provider = getJsonRPCProviderHardhat();
  });

  beforeEach(async () => {
    snapshot = (await provider.send('evm_snapshot', [])) as number;

    const firstActiveWallet = getActiveWallets()[0];
    await (
      await depositToPaymaster(
        chain,
        firstActiveWallet,
        parseEther(configDefaults.paymaster.minBalanceForAvailability),
      )
    ).wait();
  });

  afterEach(async () => {
    resetPaymasterGasBalanceCache();
    await provider.send('evm_revert', [snapshot]);
  });

  it('[HH] Should create pre-authorization that verifies through Paymaster contract', async function run() {
    if (!process.env.RUN_HARDHAT_TESTS) {
      this.skip();
      return;
    }

    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chain,
      MOCK_RELAYER_FEE_TOKEN_ADDRESS,
      {
        price: 1,
        updatedAt: Date.now(),
      },
    );
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chain,
      networkHardhat.gasToken.wrappedAddress,
      {
        price: 1,
        updatedAt: Date.now(),
      },
    );

    const railgunWalletAddress = getRailgunWalletAddress();
    const { viewingPublicKey } =
      getRailgunWalletAddressData(railgunWalletAddress);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockTxStruct: any = {
      boundParams: MOCK_BOUND_PARAMS,
      commitments: [MOCK_COMMITMENT_HASH],
    };
    const relayerFeeIndex = 0;
    const { commitmentCiphertext, commitmentHash } =
      convertTransactionStructToCommitmentSummary(
        mockTxStruct,
        relayerFeeIndex,
      );

    const preAuthorizeData: RelayerRawParamsPreAuthorize = {
      chainID: chain.id,
      chainType: chain.type,
      feesID: '468abc',
      gasLimit: '0x1000',
      relayerViewingKey: hexlify(viewingPublicKey),
      commitmentCiphertext,
      commitmentHash,
      devLog: true,
      minVersion: getRelayerVersion(),
      maxVersion: getRelayerVersion(),
    };

    const signedPreAuthorization = await preAuthorizeRequest(
      chain,
      preAuthorizeData.feesID,
      preAuthorizeData.commitmentCiphertext,
      preAuthorizeData.commitmentHash,
      preAuthorizeData.gasLimit,
    );
    expect(signedPreAuthorization).to.have.property('signature');

    const { signature } = signedPreAuthorization;
    const { address: paymasterContractAddress } =
      ContractStore.getPaymasterContract(chain);
    const domain = PaymasterWallet.getDomain(chain, paymasterContractAddress);
    const data = PaymasterWallet.getPaymasterPreAuthorizationDataField(
      signedPreAuthorization,
    );

    // Verify signature
    const signerAddress = verifyTypedData(
      domain,
      TYPES_PAYMASTER_PRE_AUTHORIZE,
      data,
      signature,
    );
    expect(signerAddress).to.equal(
      PaymasterWallet.getPaymasterWallet(chain).address,
    );

    const paymasterContract = ContractStore.getPaymasterContract(chain);

    // TODO: Modify this request when its parameters and output are known.
    const contractResponse = await paymasterContract.verifyPreAuthorization(
      signedPreAuthorization,
    );
    expect(contractResponse).to.equal(true);
  });
});
