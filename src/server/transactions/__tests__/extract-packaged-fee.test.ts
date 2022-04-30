import * as ed from '@noble/ed25519';
import { FallbackProvider } from '@ethersproject/providers';
import { Note, Lepton } from '@railgun-community/lepton';
import { ERC20RailgunContract } from '@railgun-community/lepton/dist/contract';
import { Transaction } from '@railgun-community/lepton/dist/transaction';
import {
  hexlify,
  padToLength,
} from '@railgun-community/lepton/dist/utils/bytes';
import { Wallet as RailgunWallet } from '@railgun-community/lepton/dist/wallet';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import { AddressData } from '@railgun-community/lepton/dist/keyderivation/bech32-encode';
import {
  SerializedTransaction,
  TokenType,
} from '@railgun-community/lepton/dist/models/transaction-types';
import { NetworkChainID } from '../../config/config-chain-ids';
import configDefaults from '../../config/config-defaults';
import { getMockRopstenNetwork, getMockToken } from '../../../test/mocks.test';
import { getLepton, initLepton } from '../../lepton/lepton-init';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from '../../providers/active-network-providers';
import {
  getRailgunAddressData,
  getRailgunPrivateViewingKey,
  getRailgunWallet,
  initWallets,
} from '../../wallets/active-wallets';
import { extractPackagedFeeFromTransaction } from '../extract-packaged-fee';
import {
  createLeptonVerifyProofStub,
  createLeptonWalletBalancesStub,
  restoreLeptonStubs,
} from '../../../test/stubs/lepton-stubs.test';
import {
  RawParamsTransact,
  tryDecryptData,
  WakuMethodParamsTransact,
} from '../../waku-relayer/methods/transact-method';
import { deserializePopulatedTransaction } from '../populated-transaction';

chai.use(chaiAsPromised);
const { expect } = chai;

let lepton: Lepton;
let contract: ERC20RailgunContract;
let railgunWallet: RailgunWallet;
const RANDOM =
  '1e686e7506b0f4f21d6991b4cb58d39e77c31ed0577a986750c8dce8804af5b9';
const MOCK_TOKEN_ADDRESS = getMockToken().address;

const TREE = 0;
const ROPSTEN_CHAIN_ID = NetworkChainID.Ropsten;
const MOCK_MNEMONIC_1 =
  'tag net body theory divert appear trip topple valve wall dog whisper';

const createRopstenTransaction = async (
  addressData: AddressData,
  fee: BigNumber,
  tokenAddress: string,
): Promise<SerializedTransaction> => {
  const transaction = new Transaction(
    tokenAddress,
    TokenType.ERC20,
    ROPSTEN_CHAIN_ID,
  );
  transaction.outputs = [
    new Note(addressData, RANDOM, fee.toHexString(), tokenAddress),
  ];
  return await transaction.dummyProve(
    railgunWallet,
    configDefaults.lepton.dbEncryptionKey,
  );
};

describe('extract-packaged-fee', () => {
  before(async () => {
    initLepton();
    lepton = getLepton();

    configDefaults.wallet.mnemonic = MOCK_MNEMONIC_1;
    await initWallets();

    const ropstenNetwork = getMockRopstenNetwork();
    const { proxyContract } = ropstenNetwork;
    initNetworkProviders();
    const provider = getProviderForNetwork(ROPSTEN_CHAIN_ID);

    // Note: this call is typically async but we won't wait for the full call.
    // We just need to load the merkletrees.
    lepton.loadNetwork(
      ROPSTEN_CHAIN_ID,
      proxyContract,
      provider as FallbackProvider,
      0, // deploymentBlock
    );
    contract = new ERC20RailgunContract(proxyContract, provider);
    railgunWallet = getRailgunWallet();

    const tokenAddressHexlify = hexlify(padToLength(MOCK_TOKEN_ADDRESS, 32));
    createLeptonWalletBalancesStub(tokenAddressHexlify, TREE);
    createLeptonVerifyProofStub();
  });

  after(() => {
    restoreLeptonStubs();
  });

  it('Should extract fee correctly', async () => {
    const fee = BigNumber.from('1000');
    const addressData = getRailgunAddressData();
    const transactions = await Promise.all([
      createRopstenTransaction(addressData, fee, MOCK_TOKEN_ADDRESS),
    ]);
    const populatedTransaction = await contract.transact(transactions);
    const packagedFee = await extractPackagedFeeFromTransaction(
      ROPSTEN_CHAIN_ID,
      populatedTransaction,
    );
    expect(packagedFee.tokenAddress).to.equal(MOCK_TOKEN_ADDRESS.toLowerCase());
    expect(packagedFee.packagedFeeAmount.toString()).to.equal('1000');
  }).timeout(60000);

  it('Should extract fee correctly from hardcoded encrypted data', async () => {
    const params: WakuMethodParamsTransact = {
      pubkey:
        '9cdaf594e242a389bc1ae73a41da8256fa1cec13e0ff41891cb85e1f80e5ce86',
      encryptedData: [
        '0x60fc1793257e5fa4e6534672e78a994de2ca4f2970d5e016e4c07b745d27557d',
        'd93889d4081b50166ced4ebdaee14dabe87c668bf7605dc409a6656c842d2a1a8a83ee7f0f85320bb0cf1cea0a57d8275fcf41ef57c305f2fe9fb4f3e85f36d32125e3064d1ab0e1431c88633ba0efb14ecb30b7ff1f0bae85d4d232f394189518dab1bcc903b04d001015b35fe2707e25c012b6a98627fc8cc9dd2d040e4e583092b6c1f21924f561d5b451e3ccb8dc50f29f88446e4890bfa5b2f5c6752cbcc2c151699a7b567f2b97f8884f64267f36c4e6cc16c758b1e154aa9fa49fdf6ced7f22eda84ff28f88e397e781cc71617f86cacb449e594e20f055d5ebebd24e38fea6a49d6fed0f435c00e3432374cf7ceac11f916d73e8f85714c6bf4055b61183d6ff558742564420acd5b82c95f19d620c19c3d72bde973f58f448ca5acdc0dc5b40b26b8bfccc984bee33c41d2c0496a86356a280da8fcb921527995f956ddd5615619e1a5eab411c8356307579ba27c0b89b0dc1b492e0589861c4514ba5d4f50e014a87f8e69316bf00e7e5fea4501836dadb8d9160dedcfc3f15f066b9dc94697690eb583f7ea3201f42fc01ff7990e336aaa7eccffa1c63f37c281fdfb09d4319d1fb96185d8461ad541451286794a74015ff912fca504bd1a009e879829bf8aca127cab4dde46d4a30fec570837b56a2b15022db960473f4c621ff78f67dced31337a87fd8cdc7e3f867d7ec8d4cbeeb581263d27d58eff22d2791ed4ac6cab258b0457a8e0209c1dd912da4825d0d02559e2c8b41d94262edfd1b3c81e8fceb22e8f9bfc2c172201b6513fa4fdca103c90906eb527138b6f5c79a19d03719d9d90181116103097f4df84113de8d8aa3007770ea61b223c255fd8a649a8e6fcace4116ae9c0977246ae10d3f8bb5a6141e975937f21009d9dec7dcc6cb39c5994b4e23f75d451f05172396cfa817374e93528cb508668e3aa431767968f2905551b0a9fc76a0086f8a0c7f15e69e9bbd92425f3796bb8a865af9407cc9f305cbba2edc20b765ca29e73ad7b044909a7880d2a65f59dda58bc31daa487af273e76513328a0bcf879f38f23f84321f449bff57c6cbd3d06cfe0177f9cf113da0f982b5f9c20305cc0dc8f457f017293d81a884820ec9f86cbbf22d150ddf6a0bf2dc7c2d8e0674c53ddb35d4fb9347ee9c94a1693711dadf6d362b4c0c6bf325e265d60009317c4b0f178c5353d95556e6b3ade1e514b653d67280a660c23e8b4e73b68c7907292f2d8fb4bd3f5ea246ef30f3c5d3a76f4f8e33c0bb217ee5f7b892517df61e28904bd14b6ebaa7a4edaf9ae81f468ab4f3194fa4c382e43c62df6451aae4e7fd8ad303fc0ae6c202914de96f69d764e88478697f4e4c7f7899ffcf4f2caed7a729fe8bb57e5b70b9c366014f17def6bbe043f6e5ae40daf9a72b2b16f28c45c595f5c67bbb4b559735f0ae7ccb930c85a2d050565667ba96ff9d4236092e2487c4b1f03f065aac535b060e74450b04a841d4ec1d8bcdc169988f16e9d7face9770cdc97f183c0ae283385c0adbd943c1ae167d99ddca98f21f9984eb34cbc6b9f97aaa1f7f5412347656089fd8682c3068dc4396827ca2a8013669b7da36cb9bdee162ff4f4d0eb7e01e58bbfa6aecddd828824c61689b159e166efb946ebd6f5221c49bc86f1a81abb9e125cfa122edf5099775f69ebefcf0787b6ee0a37668120e55d8e65332a0de837b67bc8810d4c9caf0e8b1e6055db475b939a76749a1e2a520b0de0ef6a89bc68c5bfc7f75817b6ecab4be5bc58897d9ae968996f815761a65bce47ee79f3646c78579aa6120b29732b8fe894d82506fd3043b971da33c3d0e8a01070406fd4b464215aeb9180447665a7bab29375b7d638650abf987fa1b074d732c28f679bdb52099458609f10f817fc611cfc0498415525fc2fb46a4b49c0717822632e6bde54d4e93c13d1662ed84d1eff8ef996c2aec68a23b1e9c6d58ee0cf5d0d4ab590de9f4aaa316db1c3b22fdcdb579891cf3865e849aedb314b69099087b6b29a5e4f64c07497a44770fdce3b8508113783f0c9fa7751e5a4bf508c0edfbd0fefc25dc2e2e9368d7dc22dd4a824bf8b8a0f0f4daf404707b0c6aa35485c266957f85fc1a4426c5b98daba81a3e07a8c648495ab7a84695753abb7f5c1757d19361b38ce374d224ddd00e87475013b39b22a23baf056aace4ea7407bb78cc0dd107bc7eae5d1871446710a9759393a6371a3ec3360981c4fa20ffc8deecbcd5bb5b87e4c4181a452a084aced7aa10f398b50903a30473bff76bcba5b5b33597644db5c268185c2585e86a943d09a138de66f4ebb47047cd0455da13ff4a94450bd4839ab1d75d19d871d455f962dbdb7926a4848b5fc7eeeeaf6d04260ef4c5f082c36101cbaac1f63efd1b724dae6f213db4a5379e00a945c1a1efcddce42254d90898455cec8008d6753288db808da1c546c803a364c8fc36bf34e6b8c2186de049ec96f68e3a8c332a72582c396232dcfe20f2d4955f87670331c4228ae6f023f112671dd400906d17d9cbaaa239524237bc849271d0bd81dd744fa49ffd4e48eeb5cfc30e651a236cf888335f8e120a945061f6c61b36c794ead14df84f0d4861f886059a92bd68a90ebd37ad7e38d60e00b0cd1268d051e470156989d028b7e18e85a61ba0bff7e0ae1e2f485e55916689d5991c4dbe7c5c149cd9660459b908a8d0550858aab0d80df4a2bdb1ba01d5ce9604170387eef36db64117e0cdf46a4aabf52790a208d05788a41e8d63f02896332ea252e2f410aadf25fb189006b52390143aa6a71a8572201f2ad4770a99a95fd8b166c78aa6662492506824ab98c406ffd254df711b103727e3dbca6c391858abc41f02739b80b283e7b1507831c19733ac37c8a465df1e3aad8a898a79b5e5838f77248a5726466dfa4bacf5bd161de907ceae36aa5065e27baa07d38fe5b70747903bc21b10319b8302bf2e7bf26475bdd4114f8aaa3c4f645eeadadafab99e57c2e5aca000c1db605cefaa6f618782b442f29b51e4f93e7714b12b065666c71e5eb6c6ce686cda73366809a4bc7f663e7524ad46a5bf3500c3265898eba6f312be98a28c163faa8a4b5b8b0447674471f582561be418aa5359f7f5c676835983b9f4d91dce648e01345f8ea3d47f0df2296084da15c6f62961e519459d534ccfc2d486faba5b42047f80bd7411b8d2377b443f3acdcd2db15f46cd9d55d5c5f0069491d36c85bca81b6ea9e30fde67e455de066710e450357fa3b5f47057c746cf8e1c458eafa426abef9bd75db375e1f739fea90655342b00f473b7da1bef80f854b9c91612f7127668aa1addc613fe47acb2b5a3396c184053d380f61e551c015eab89355aaa09b2b66cbe45a149e5d20c9b4eeb90d13bf3d97a19fb51e560cacf0dd5ba2bf24bc89cb9376b4bb9a472b0a5387b179cd6fd85ac6b2f104771bf340c96897b03264dc86ba1321c4342da049e1d8dfbe24d1df8ac641add3063a452e78bba37185ff059f35b0cd3001e9e8f77066af82d3e02995c8089ac5a41e4586f8a34ee28ef1ba5c1fc4e4364cbecfbba2f151d9788f1eb4b94472c47cacfe1cb0031bb7d4d9ce42cb0b51e474ff5896930ffbcd34e345817d6939deeae1027cc965b49be38c4fc52550593f45a24855271fe086c5432f5747a1ad72f478e1a982027feae5a39b4daa991c5013c272e94e920a2a47413dc1714f720ac81d798fc3fda4d2179745ad7cf8ae4521906241df44568ecfe069e73939880334dd6f617d9183b62fde173733b56fdd9710546ea1f94e6f930dec433bb66e54cb917cee681fbe071dbc6e35cc6347c701e44c01fd2cdf652e6d0dfede8ab83c6757768d68ae4afdce77be06b8af789f2d06202097e9898fcb482f86668d96ca64247a753b1d89fc68e7b059cb43f5176dc5a288b267d7fef1bac0f0598d94dc42f052225108eb1fd09eb4b2293aee3320be758d023641987347708e3ccd51680281e5899f5d10046c0dd5d4b6134ab192e33df5a6baeea9de9368caf64345667e7ad3ce61721d8d41b43f6167da5269572bdab476ceee80e226408c36b951aea4eac7e9bd8bdb04e42d2b6d9af6b8af3f7c2c9036cbbfc762e09933405c725a64c0ae1f2973a74b0cd7d33bea4b61f45e7a62dfc4bf19a660c0291445418599eb29258e9879f1fb765dc7c37aec0ff2104dcec29c4fa4121164b7b0649a61adf6461d106636651b0d9b8a6151b51dfcc92b55d30ac4955cf13b433a9c84428a7bffc82fa6fcb8bec32a7f6b44379da678489ceb25558191bc390f2b7749eb3cb7897ca98962a77ccc572eaba1149406f54c85a6cd64821bcad949f690c3ae8486f9196e1130d8eb27b75a7ce54381cbab0c66ba737d33e4c4e177c52bdcc520f27a3dd412045234779bc7daa3b64f8be5ab25e30795e2d1baed6cb09942b32b3e0065aa297ba02c78e5ef0a788f638006ff131b002e46b03f402f0d8f4ef46199ff603a8f38b068eca13e8b05fab4e5d4d8409928b00d45da35e5996224b9738348ec0eab5ea25fe8b7b68928cc9e7cdc1963e952ff8ae6ed546093b00cbf376ec79290cab2f2b9e090a06907e6df9dc86ab990953b76d743e05e6ac0c8de58c902ee77c587fcbf5f49f7e39149f07a793c0b368e4998605d63907b4ceb373319432e9505abb0b8a0e5999bcb0d139b68898e4152242f1f5990b16c74418004c59520ce20bbd9b9d685f25b32778f6546c03b97620c9ce5023809d675da4ad04c946fda0eee42b75a318bd789dcc2d18ac155b41dee8f92768ba80716c9916d0796a386b2957bf0e1ef387d641bf926650f225d061e4054feffad23940d352b49baed1b6db6a1308f8a623b488060b46c679c7ad8a3983adc3826e2a96376e875168087e6653c72816cd9118f1bc38d01e77b5af59bb19c3e6ec26e6c766f6d97e1f64a512df71a116c7fd12dda0eb4011165b973ea5ccd5103a6f17e6736b047459444470fb35c22a8252ea047db0832e29ace142fa78fd179fb0357ae9549ed2c3231c36ba00f999374b26463b5593cd9104a285aebdfe66b53c011cc7439fa5b48f1db58ae401529622b115717cd3a5e3bb9cbc9b9f815485460cde2cde76a45c9ca7f109137da0b956c13765f7ab26d19db27dd1a5aea99e75c81b9f8451bde43e6fa0666cf80f11298ec4d6f2a6040bebfd58023bf4452595273bc0f0e0767ebe550d4cdf41e6ea2021e5c5176ad929088b53268afc87f0af18de669df892e9bd74859d91200672c0aa2e238777980ca1a4a6b80970fc42a41e20a73c26e2e6d108684e6951b2602c965f4199cd87c49ef9aec1d5fd34c785719bd687726a4092e14d312def9c982d8b90c0ba786e330b55495d2dc3c1cafe8428bce33dcc03b176ab7f141e47a02d3e2efdb55cf74c7f1b3afa7bfc0b1ab49074cb187a522972f2c7b7606037c9bcdf69963e9cf8a3510efc5dc17cba276a0812717885c34abe8cdc983b0e13782223e1de6ffc2c956fc0175e4d02e92fa47ac14df1ae7587ceff28aa97b2ad29afd2355fa1f3d5eaf9df4f35981a651e57c66a97da95b175d0f3d5631bad9072c51fca20d0a313132c5edb349268f690d07575698e82558fffc214c8facf619a4b5a54a984b46ba58b68ead97fd7acecdc5d07a063fd549f10139e100e38e7461bc3ae8af9360a7ae517d8dc819d07f42d628f5ff57af8dbb0aedfe1d95b4131b440b61020077678ccded6be2b4da153e8daaec6a84c7b4392c3f078275217013b3359d792236a3cd054e9785b36c8108d005bcfeafaed40eb30ffc3c9fbc238707c924527fc3988fd5da17d3a526adce5d602454539b5a36d90b8c6056bc02f7a7203fa7852c60323797b545a1519c590e0695b52aea97be501812f067a81f4f23336a17e9c0b9ea11d8bb30e3306c9845d69',
      ],
    };

    const { pubkey: clientPubKey, encryptedData } = params;
    const viewingPrivateKey = getRailgunPrivateViewingKey();
    const sharedKey = await ed.getSharedSecret(viewingPrivateKey, clientPubKey);
    const decrypted = await tryDecryptData(encryptedData, sharedKey);
    const { serializedTransaction } = decrypted as RawParamsTransact;
    const populatedTransaction = deserializePopulatedTransaction(
      serializedTransaction,
    );
    const packagedFee = await extractPackagedFeeFromTransaction(
      NetworkChainID.HardHat,
      populatedTransaction,
    );
    expect(packagedFee.packagedFeeAmount.toHexString()).to.equal(
      '0x053b1e906e042a',
    );
    expect(packagedFee.tokenAddress).to.equal(
      '0x5fbdb2315678afecb367f032d93f642f64180aa3',
    );
  });

  it('Should fail for incorrect receiver address', async () => {
    const fee = BigNumber.from('1000');
    const addressData = Lepton.decodeAddress(
      '0zk1q8hxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kfrv7j6fe3z53llhxknrs97q8pjxaagwthzc0df99rzmhl2xnlxmgv9akv32sua0kg0zpzts',
    );
    const transactions = await Promise.all([
      createRopstenTransaction(addressData, fee, MOCK_TOKEN_ADDRESS),
    ]);
    const populatedTransaction = await contract.transact(transactions);
    await expect(
      extractPackagedFeeFromTransaction(ROPSTEN_CHAIN_ID, populatedTransaction),
    ).to.be.rejectedWith('No Relayer payment included in transaction.');
  }).timeout(60000);
}).timeout(120000);
