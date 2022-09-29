import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getMockProvider } from '../../../test/mocks.test';
import {
  createEthersWallet,
  getActiveWallets,
  getRailgunAnyAddress,
} from '../active-wallets';
import { setupSingleTestWallet } from '../../../test/setup.test';
import { initEngine } from '../../lepton/lepton-init';
import { RailgunEngine } from '@railgun-community/engine/dist/railgun-engine';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('active-wallets', () => {
  before(async () => {
    initEngine();
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
    const railgunAddress = getRailgunAnyAddress();
    expect(railgunAddress).to.equal(
      '0zk1qyk9nn28x0u3rwn5pknglda68wrn7gw6anjw8gg94mcj6eq5u48tlrv7j6fe3z53lama02nutwtcqc979wnce0qwly4y7w4rls5cq040g7z8eagshxrw5ajy990',
    );
  });

  it('Should check pubkey value matches across networks', () => {
    const viewingPublicKeyAll = RailgunEngine.decodeAddress(
      getRailgunAnyAddress(),
    ).viewingPublicKey;
    const viewingPublicKeyRopsten = RailgunEngine.decodeAddress(
      getRailgunAnyAddress(),
    ).viewingPublicKey;
    expect(viewingPublicKeyAll).to.deep.equal(
      new Uint8Array([
        119, 215, 170, 124, 91, 151, 128, 96, 190, 43, 167, 140, 188, 14, 249,
        42, 79, 58, 163, 252, 41, 128, 62, 175, 71, 132, 124, 245, 16, 185, 134,
        234,
      ]),
    );
    expect(viewingPublicKeyRopsten).to.deep.equal(viewingPublicKeyAll);
  });
}).timeout(10000);
