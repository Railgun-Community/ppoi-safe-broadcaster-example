import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  PreTransactionPOIsPerTxidLeafPerList,
  TXIDVersion,
} from '@railgun-community/shared-models';
// eslint-disable-next-line import/no-extraneous-dependencies
import { POI } from '@railgun-community/engine';
import Sinon, { SinonStub } from 'sinon';
import { RelayerChain } from '../../../models/chain-models';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { startEngine } from '../../engine/engine-init';
import { POIValidation } from '@railgun-community/wallet';
import { validatePOI } from '../poi-validator';

chai.use(chaiAsPromised);
const { expect } = chai;

const txidVersion = TXIDVersion.V2_PoseidonMerkle;
const chain: RelayerChain = { type: 0, id: 5 };

let getActiveListsStub: SinonStub;

describe('poi-validator', () => {
  before(async () => {
    getActiveListsStub = Sinon.stub(POI, 'getActiveListKeys').returns([
      'test_list',
    ]);

    startEngine();

    await initNetworkProviders([chain]);

    // Set a mock validator for poi merkleroots.
    POIValidation.init(async () => true);
  });

  after(() => {
    getActiveListsStub.restore();
  });

  it('Should validate pre-transaction POI', async () => {
    const contractTransaction = {
      to: '0xe8bEa99BB438C2f3D533604D33258d74d5eE4824',
      data: '0xd8ae136a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002007df940dd5666c7e160663710a9019f7a44bc275e273e27718a340f6f65a83d12075ebf125d100e99ffa9b513bed56e3c9a8f37da6c02c29e5fba73a46f35e6525c96a94760c7e12de61dafa4415b9e81967088b80976591bbe9a89887fe30ad26807b901f7f73dac0aa6b1dc62d6275d90c2ba5a31d5922c58262d07b6dc72708ab5944c5c485ce47391334a3c3f251ef71fcec21028163f85e241473c1679616ed910d6fc71bba723ac96e4228c475460d78fdca31630047ab761c58f8d4252b511e7bb28f89785a29654e1868a44f499a0e3071d019be14a351083a762c672e194ddd378173fea4e2db896507ef7ee930e50f4a430838c84b5ac9d366fd84233cbba7a2f85b8f16396a69f95536332185b2cf0dad93319c025df5d2773dc40000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000000000000000000000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001043561a8829300000000000000000000000000000000000000000000000000000000000000000000105802951a46d9e999151eb0eb9e4c7c1260b7ee88539011c207dc169c4dd17ee00000000000000000000000000000000000000000000000000000000000000032c5acad8f41f95a2795997353f6cdb0838493cd5604f8ddc1859a468233e15ac0c3f2e70ce66ea83593e26e7d13bd27a2a770920964786eaed95551b4ad51c4e05b93bb7d3cd650232f233868e9a420f08031029720f69df51dd04c6b7e5bd700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000007a690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001c0abcdef1234567890abcdef12345678906ef0c3ccf9f6a1f57bc75ed315cb2c2e974fdceb364979001130386f15d5a9fd5bf604085b50a6789ed2823409c1244ffd614c564ef11897939efd4eabccb32287c305da3390cbf05c66ae0d4d9cef10a1a41e92db2dee7b4dab052d5c03dccac780cdf00d37202b1ee53706502e314e807bffcd9525cef062cf6a96f544f71eda6f6407a60ff2ee5e66abfececcc849523eb8739084fa32e1219269617a3fd1dcd1830e75231ace190d457399a98faf00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905e37f054ac7f9b130bd8b81d3f07a6d5a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb00000000000000000000000000000000000000000000000000000000000000000000abcdef1234567890abcdef1234567890e395b0874113ab1f01608b4c696ebaacc2ee49248fdede26b3a1cd7449546b9801dbd8338eea34c20d73ce23a4f2e951e212d0ad7014eae3de2fe1416a2e6292480b8f26f1d44556068dff5928a9bf12379e865e3f9bc7d82d50914498a5cac86fb6d4baa83f56a32e8be44068d29a5c6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905d3e7731ef5e92946e9b9914b862e5f4a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb00000000000000000000000000000000000000000000000000000000000000000000',
    };

    const pois: PreTransactionPOIsPerTxidLeafPerList = {
      test_list: {
        '136f24c883d58d7130d8e001a043bad3b2b09a36104bec5b6a0f8181b7d0fa70': {
          snarkProof: {
            pi_a: [
              '13766471856281251472923302905099603168301598594631438526482227084351434874784',
              '8588729525737659890182759996444901624839043933579336012761314740925805937052',
            ],
            pi_b: [
              [
                '14369045691397547776662456281960288655359320266442203106166271127565009565977',
                '13979602192554711032664475121727723415005805236727028063872064436784678703054',
              ],
              [
                '19941723190973813766411664236004793025252825360816561816851087470547847175501',
                '17786622999411477509388993850683907602108444106094119333080295444943292227976',
              ],
            ],
            pi_c: [
              '640379350533687394488172632727298795692314074384434085471944446397998938790',
              '20177179856562770201382212249372199931536044097005309916738846107336280050881',
            ],
          },
          txidMerkleroot:
            '171280a4deabf34cc6d73713225ece6565516313f4475a07177d0736e2b4eaa4',
          poiMerkleroots: [
            '284d03b4f4e545a9bf5259162f0d5103c1598c98217b84ec51589610d94f7071',
          ],
          blindedCommitmentsOut: [
            '0x1441c994c1336075c8fc3687235e583fb5fa37e561184585bac31e3c029a46eb',
            '0x19f596cb35c783ce81498026696fae8f84de0937f68354ef29a08bf8c01e3f38',
          ],
          railgunTxidIfHasUnshield:
            '0x0fefd169291c1deec2affa8dcbfbee4a4bbeddfc3b5723c031665ba631725c62',
        },
      },
    };

    await validatePOI(
      txidVersion,
      chain,
      contractTransaction,
      false, // useRelayAdapt
      pois,
    );

    // Invalid value
    pois.test_list[
      '136f24c883d58d7130d8e001a043bad3b2b09a36104bec5b6a0f8181b7d0fa70'
    ].snarkProof.pi_a[0] =
      '13766471856281251472923302905099603168301598594631438526482227084351434874783';

    await expect(
      validatePOI(
        txidVersion,
        chain,
        contractTransaction,
        false, // useRelayAdapt
        pois,
      ),
    ).to.eventually.be.rejectedWith(
      'Could not validate Proof of Innocence - Relayer cannot process this transaction.',
    );
  }).timeout(20000);
});
