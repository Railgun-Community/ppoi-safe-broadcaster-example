import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { TXIDVersion } from '@railgun-community/shared-models';
import { RelayerChain } from '../../../models/chain-models';
import { initNetworkProviders } from '../../providers/active-network-providers';
import { startEngine } from '../../engine/engine-init';
import { ValidatedPOIData } from '../poi-validator';
import { POIAssurance } from '../poi-assurance';

chai.use(chaiAsPromised);
const { expect } = chai;

const txidVersion = TXIDVersion.V2_PoseidonMerkle;
const chain: RelayerChain = { type: 0, id: 5 };

describe('poi-assurance', () => {
  before(async () => {
    startEngine();

    await initNetworkProviders([chain]);

    POIAssurance.init();
  });

  it('Should insert and get items from poi assurance DB', async () => {
    const txid =
      '0x1234567890123456789012345678901234567890123456789012345678901234';
    const validatedPOIData: ValidatedPOIData = {
      railgunTxid: '0987654321',
      utxoTreeIn: 0,
      commitment:
        '0x1234567890123456789012345678901234567890123456789012345678901234',
      notePublicKey: '0x1234567890',
      preTransactionPOIsPerTxidLeafPerList: {
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
      },
    };

    await POIAssurance.queueValidatedPOI(
      txidVersion,
      chain,
      txid,
      validatedPOIData,
    );

    const validatedPOIs = await POIAssurance.getValidatedPOIs(
      txidVersion,
      chain,
    );
    expect(validatedPOIs).to.deep.equal([{ txid, validatedPOIData }]);
  });
});
