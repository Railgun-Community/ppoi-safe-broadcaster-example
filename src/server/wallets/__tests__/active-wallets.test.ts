/* globals describe, before, it, beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Wallet as EthersWallet } from 'ethers';
import { getMockProvider } from '../../../test/mocks.test';
import {
  createEthersWallet,
  derivationPathForIndex,
  getActiveWallets,
  getRailgunAddress,
  getRailgunWalletKeypair,
  getRailgunWalletPubKey,
} from '../active-wallets';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initLepton } from '../../lepton/lepton-init';
import { NetworkChainID } from '../../config/config-chain-ids';

chai.use(chaiAsPromised);
const { expect } = chai;

const MOCK_MNEMONIC =
  'hint profit virus forest angry puzzle index same feel behind grant repair';

describe('active-wallets', () => {
  before(async () => {
    initLepton();
    await setupSingleTestWallet();
  });

  it('Should have correct wallet address and keys', () => {
    const activeWallet = getActiveWallets()[0];
    const provider = getMockProvider();
    const ethersWallet = createEthersWallet(activeWallet, provider);
    expect(ethersWallet.address).to.equal(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    );
    expect(ethersWallet.publicKey).to.equal(
      '0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5',
    );
    expect(ethersWallet.privateKey).to.equal(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    );
  });

  it('Should have Railgun wallet with valid address', () => {
    const railgunAddress = getRailgunAddress();
    expect(railgunAddress).to.equal(
      'rgany1qyglk9smgj240x2xmj2laj7p5hexw0a30vvdqnv9gk020nsd7yzgw8ypm04',
    );
  });

  it('Should check pubkey value matches across networks', () => {
    const pubkeyChain0 = getRailgunWalletPubKey();
    const pubkeyRopsten = getRailgunWalletKeypair(
      NetworkChainID.Ropsten,
    ).pubkey;
    expect(pubkeyChain0).to.equal(
      '11fb161b4495579946dc95fecbc1a5f2673fb17b18d04d85459ea7ce0df10487',
    );
    expect(pubkeyRopsten).to.equal(
      '11fb161b4495579946dc95fecbc1a5f2673fb17b18d04d85459ea7ce0df10487',
    );
  });
}).timeout(10000);
