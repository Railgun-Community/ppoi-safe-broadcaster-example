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
import { validatePOI } from '../poi-validator';
import { setupSingleTestWallet } from '../../../test/setup.test';

chai.use(chaiAsPromised);
const { expect } = chai;

const txidVersion = TXIDVersion.V2_PoseidonMerkle;
const chain: RelayerChain = { type: 0, id: 5 };

let getActiveListsStub: SinonStub;

describe.skip('poi-validator', () => {
  before(async () => {
    getActiveListsStub = Sinon.stub(POI, 'getActiveListKeys').returns([
      'test_list',
    ]);

    startEngine();

    await initNetworkProviders([chain]);

    // Deriv index 1
    await setupSingleTestWallet(1);
  });

  after(() => {
    getActiveListsStub.restore();
  });

  it('Should validate pre-transaction POI', async () => {
    const contractTransaction = {
      to: '0xe8bEa99BB438C2f3D533604D33258d74d5eE4824',
      data: '0xd8ae136a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020232dab5b7ecaa2cd390f8f056a0619c4c338856e90a16801ab3478cb545b57e61f28a82bb780ba52973d98e8bfa0162ed21978bda341ed0981489482fa01c77d16892a7d43ab52122bdcf05074077cbd91ca47a0515e46ce8a23f6edf80b0cee0a1c7a4ad7afec983364d29f8788b22bee832555b875ecf18638653c4369e7fa0611df5df0a91e90012cf93cebc328a6615b0aee6c67c65ebe2d620a2a3c378318c4e4b75ac2540049eefd61d833b9dd0307fa4aaec827771c85ac3c7135a396289f854da4bfde348531ba44c263318a276b4641cd61938a429d4fd417906c710dba738e05678897c0bd08cdbfaf0c9ae1d3d15f6569fd4fe4f31ebb286a628c233cbba7a2f85b8f16396a69f95536332185b2cf0dad93319c025df5d2773dc40000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000000000000000000000000000000000000000000000000000000000000000000009fe46736679d2d9a65f0992f2272de9f3c7fa6e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001043561a8829300000000000000000000000000000000000000000000000000000000000000000000105802951a46d9e999151eb0eb9e4c7c1260b7ee88539011c207dc169c4dd17ee00000000000000000000000000000000000000000000000000000000000000032c5acad8f41f95a2795997353f6cdb0838493cd5604f8ddc1859a468233e15ac0c3f2e70ce66ea83593e26e7d13bd27a2a770920964786eaed95551b4ad51c4e05b93bb7d3cd650232f233868e9a420f08031029720f69df51dd04c6b7e5bd700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000007a690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001c0abcdef1234567890abcdef12345678906ef0c3ccf9f6a1f57bc75ed315cb2c2e974fdceb364979001130386f15d5a9fd5bf604085b50a6789ed2823409c1244ffd614c564ef11897939efd4eabccb32287c305da3390cbf05c66ae0d4d9cef10a1a41e92db2dee7b4dab052d5c03dccac780cdf00d37202b1ee53706502e314e807bffcd9525cef062cf6a96f544f71eda6f6407a60ff2ee5e66abfececcc849523eb8739084fa32e1219269617a3fd1dcd1830e75231ace190d457399a98faf00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905e37f054ac7f9b130bd8b81d3f07a6d5a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb00000000000000000000000000000000000000000000000000000000000000000000abcdef1234567890abcdef1234567890e395b0874113ab1f01608b4c696ebaacc2ee49248fdede26b3a1cd7449546b9801dbd8338eea34c20d73ce23a4f2e951e212d0ad7014eae3de2fe1416a2e6292480b8f26f1d44556068dff5928a9bf12379e865e3f9bc7d82d50914498a5cac86fb6d4baa83f56a32e8be44068d29a5c6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905d3e7731ef5e92946e9b9914b862e5f4a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb00000000000000000000000000000000000000000000000000000000000000000000',
    };

    const pois: PreTransactionPOIsPerTxidLeafPerList = {
      test_list: {
        '136f24c883d58d7130d8e001a043bad3b2b09a36104bec5b6a0f8181b7d0fa70': {
          snarkProof: {
            pi_a: [
              '5380762281835890066100090423863705522896972209892318692303327183855508202767',
              '11036679349320452419967824441721309024857468320780759951614866246507617986379',
            ],
            pi_b: [
              [
                '5115840209701577903925325063762772924357454881596996800947316604059087792757',
                '16512788805950483671906566767892308778067849690985609542392540226010090835490',
              ],
              [
                '14211819371472883670521096940957426318269436505511811018946379122303800209684',
                '3010912222885073021392049091933573960610932519969201999874020107525206868234',
              ],
            ],
            pi_c: [
              '12876359361927135091199956730466477505146955933153249817303688966791342815821',
              '1711500457819302634083345214883352639387259771625484512325980604438024281129',
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

    const validatedPOIData = await validatePOI(
      txidVersion,
      chain,
      contractTransaction,
      false, // useRelayAdapt
      pois,
    );
    expect(validatedPOIData).to.deep.equal({
      notePublicKey:
        '0x0630ebf7bb25061ed25456a453912fd502a5b8ebc19ca3f8b88cb51ef6b88c92',
      railgunTxid:
        '0fefd169291c1deec2affa8dcbfbee4a4bbeddfc3b5723c031665ba631725c62',
      utxoTreeIn: 0,
      commitment:
        '0x2c5acad8f41f95a2795997353f6cdb0838493cd5604f8ddc1859a468233e15ac',
      preTransactionPOIsPerTxidLeafPerList: pois,
    });

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

  it('Should validate pre-transaction POI', async () => {
    const contractTransaction = {
      to: '0xe8bEa99BB438C2f3D533604D33258d74d5eE4824',
      data:
        `0xd8ae136a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000d60180f5502939b130cece7b2df689396e8b268205d01df676859f27a13a6680fb2251cf9a3075256f6e2cb6b5d8737074496d907fdd53d02368e8994e301cb64880987fc65cd5b91c11335089b9e74714e4bb6a4619ec4883a8c4d31cf1381e7db0322769f063cfdc691c4b342375a8bb9bbac43f06888a761dd7e7978962902fe10f4b6693f86c268d2d2dec5ffa002c0fc984b185d00dd00813a9899fd336a911b27fff2e774fa8e3cc3d95281cf878b29e659bb9b287962e7eb38c077882e7c21feb232f320803759469d958eb259f99f75a502c5e4ca8db2a1669b4d56d3911fef136d2c2c17c763eac6e112dcebfb9c24bf2399951a81e8d280d25fe61f5e1b726837c36055dcae3220865899ae6db91aa8e21f274d13d61851dead8616e40000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000105802951a46d9e999151eb0eb9e4c7c1260b7ee88539011c207dc169c4dd17ee000000000000000000000000000000000000000000000000000000000000000120574897cbb52d5aeb5786cf1ae005063c5b5bda033591d064c384de898daa8f0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007a690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020abcdef1234567890abcdef12345678903f1aa84c81ee41fe4b592e59f6ae29b8fcfa89b6ef5276cfb3328b72ee80be16747009510e2a8ef0ea12550667aa8453779de6b0aacaf95336d4dc3ac0743052b41dd60e7be5501d2aa082c48d2a0891e266299b09034ed01eeace42ee1e4e4ea174798b47b0e26fbafb7d55114b069f6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304eec5d0d722d8e624d96c8e5a555879fbaeabaeb84894cf9a02ebe0021444a429e900000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905f3e7731ef5e92946e9b9914b862e5f4a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb000000000000000000000000000000000000000000000000000000000000000000861bd0f7df68d0e72bd610b2c42a7e4f0a77622359b4741cb8cb00f1ff99d8bf2234c5709d4b9097b2b7347995c0f6e0b23beb51698b8a946de4c99252a2480e1700096535bf4acd30b1599bd2bd558ebd5df46d1d453fc71399a7b30a651f40148c1bcacca4073c299e395940827866e64e47aceb4f732fb215591cee5a5bbc11aaa445a0e3350000000000000000000000000000000000000000000000000000115fa82bd79b5954be393a801205f09f54b0d82cc30df31301ec1a4bfb8a08b6082698fe37cb136b0a1f7680bc144664d9a8afc9e75dca406ece5eca9a24f7e0205a3f4717db3324e863b7ef70075ea729565058a4ea0b2998ca703ec596977a0586daa2cdd21a9bb13fa6b2fde7e125a1a1a53c6addbdf6ce3c9fd40533cc51280b0d8b4e9315e0cc9ae5f57f2a08252f23fcec7b6b0ce71b4bb569e5ccbfe50800facc0ad6eac04bd58f69043319f99ac94bb55ccc63960a0cd7045769f2e708fc8399632abbd0d21cab8391604b926453aeba6ad4cd06d8161f5c98c3ca15139e73ddd1190154b6c8c6c9a7c0bd0f41a9df` +
        `72439220ee4fd9bfb5fb7b5c6f1b726837c36055dcae3220865899ae6db91aa8e21f274d13d61851dead8616e40000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011979a7ae23bd9fb1ace87a08899a09f4bb802cd225bb64b69397badb46f4a8bf00000000000000000000000000000000000000000000000000000000000000020fb6a2f3ae9930ecb0cb861769a9ce9ae7b8d26d6feb16b444fb7ab8a44269d40fc788da428a438d922c405d420645faa34d61db7b482fe12da767b5d660d3ed0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007a690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001e0abcdef1234567890abcdef12345678906e6d99d543e1f486661e5c23135159aa974fdceb364979001130386f15d5a9fd5bf604085b50a6789ed2823409c1244ffd614c564ef11897939efd4eabccb32287c305da3390cbf05c66ae0d4d9cef10a1a41e92db2dee7b4dab052d5c03dccac780cdf00d37202b1ee53706502e315b807bffcd9525cef062cf6a96f544f71eda6f6407a60ff2ee5e66abfececcc849523eb8739084fa32e1219269617a3fd1dcd1830e75231ace190d457399a98faf00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905e37f054ac7f9b130bd8b81d3f07a6d5a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb00000000000000000000000000000000000000000000000000000000000000000020a06ceab66597a3954216929cec2bcc6c439c5f748afea1f91c5081f0f416a2d3abcdef1234567890abcdef12345678904ec10d2bd5459a859d5d25f20d1620f5c2ee49248fdede26b3a1cd7449546b9801dbd8338eea34c20d73ce23a4f2e951e212d0ad7014eae3de2fe1416a2e6292480b8f26f1d44556068dff5928a9bf12379e865e3f9bc7d82d50914498a5cac86fb6d4baa83f56b4ea21c1c81fa29a4f6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee6d30dd91789253059973d76514a96afae3719f7a17f4c58813193035f1d304ee00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000003eabcdef1234567890abcdef12345678905d3e7731ef5e92946e9b9914b862e5f4a84b23bafdf708b85030621980ef2415c1c23f0aed8b6555703f50a553eb000000000000000000000000000000000000000000000000000000000000000000000e1df8df22fad9c0385e1e4241589368ef80ad2c283d9784ef498f58501be9d008a17482cce37441bb2cbd4c89cfc68d2088d27fb2da70d5876e748c0ff86e1507c00f9a698ae2f74a409639f50c8c777e9f3f354c29d7124d444df4849807572c7b7e988c190954541e46272610a06095385492bd40110d906c1d7e81a711181ad081053560626736db9bb0a55751dc7f24e1b4491d0fcdf1b5ea23fa3a259a24fa189cd53b21e563617336b7e879fba436e2810ceb83b80cc683e5f29cd11f02d39d5ed3eb75e4fdca02f43e86140b02d7aab73c9c66fab9f1152e9f4228fa1ee1305c831893724313a0dd38e569d1096b858e14d80b6a7d0f0d4dea2c125d1b726837c36055dcae3220865899ae6db91aa8e21f274d13d61851dead8616e40000000000000000000000000000000000000000000000000000000000000220000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000000001000000000000000000000000f4b146fba71f41e0592668ffbf264f1d186b2ca8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001198076084b723707b10920e9135483daa4379ac3e72390fcf47bab35d138f54e00000000000000000000000000000000000000000000000000000000000000012c60b247836a7084735eef93e393c27780df6ee15aa491be6f0ce9115506f1580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000007a690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000`,
    };

    const pois: PreTransactionPOIsPerTxidLeafPerList = {
      test_list: {
        '2eda44ed92d7804b38f590206907db4ec39e245f7dc96980c2857b55d529b2d5': {
          snarkProof: {
            pi_a: [
              '7036887627280321954819283438881479610354521463051621548010755089152338919464',
              '21781350282637376133219705474852314134398800721785108918703644940320383601269',
            ],
            pi_b: [
              [
                '5260870664299012261660955346369926761109320597684556634190936882746261484169',
                '6637669532211196718191958747186254667132733975723514186502404919113392771866',
              ],
              [
                '13727879960588229272319475321410399080148505244709413861581160191213457197187',
                '3909905358889719648510001795671647628454626508699127325480533837798677067334',
              ],
            ],
            pi_c: [
              '19100942082327314339632083616599846287112349499934665099827773180201529094842',
              '7005264754187333027894033019415095013442020857746115988639449148177110587481',
            ],
          },
          txidMerkleroot:
            '25d05c79d924615e4d6958bf19e0acbf071c0ae7d42348392a6ae5970d6b629e',
          poiMerkleroots: [
            '08ef7f01c4af60277b1614f5adbfb341ee67b8c22112ee9d51960b2a6aa60f5e',
          ],
          blindedCommitmentsOut: [
            '0x0629b5fa1e5f38a336d769e74418649303fca978e8318fc31fea1b2902157d0f',
          ],
          railgunTxidIfHasUnshield: '0x00',
        },
        '2a8422c40ac1ae5d8e961fa470af88ce67eaece3739360abf5a434730440d42c': {
          snarkProof: {
            pi_a: [
              '3843328604968201633116485424593409157587861156591646319616754618558044281773',
              '1705252558576471292530952807712453519876148448728387363457876315581822886235',
            ],
            pi_b: [
              [
                '16118986805225135794983352262198091193474052355561472864086944531606511181010',
                '13964862454161880752746754866361219051705845617044240696508753120428331301524',
              ],
              [
                '17114357146623263722655547620339286472161603354053810819754766583820155638573',
                '19626243708595394902200031923109682067688082896307766833211136203202063321841',
              ],
            ],
            pi_c: [
              '11681902951845761203784493277124607719084643725980958306225331097272725535478',
              '15650995979074505504669150744482018854342312565632491055612685674401790738689',
            ],
          },
          txidMerkleroot:
            '1abe6cdc1199db60b76000f8d7a051c3dbbfe16f967b935734a8d927101bb8b0',
          poiMerkleroots: [
            '07e3c6d53d0a57ffd45936d22ecbeabe888200b473ab83cff0358b7c032b9507',
          ],
          blindedCommitmentsOut: [
            '0x190efdad5bac7773ec25fdf5b978a2f0c65a4f8ee588b4dea21cb0cd324c273d',
            '0x0fb55d7ba3d57e8c5a974a9d1737209640d80ca5eff4c64c368dafb55fd9603b',
          ],
          railgunTxidIfHasUnshield: '0x00',
        },
        '1c8398fb3218ad8b19c1ee0def0a8bce4e8d2d2e7d5e83dd1db8d3993dae5d67': {
          snarkProof: {
            pi_a: [
              '11941166875705462101129971285651881643386952761460704673935054181670460245482',
              '379014265952956664708270433953497077767411200687168018855571643316952967701',
            ],
            pi_b: [
              [
                '20864642192616281208731111489756025135119482483218148399251380751648678690422',
                '828242111674359739458380928129613952573116298308647443662673424981391987101',
              ],
              [
                '6497482807286983446633426975122490919945460029688356353806234414479170529676',
                '4474094088316083481990384371752305057011674452611844435930961667176174962536',
              ],
            ],
            pi_c: [
              '13314064900434952956940005777467836299241331760977123563216023301802585201300',
              '9400868502684200141720827996090778279287535634884124041196650237020154614758',
            ],
          },
          txidMerkleroot:
            '2306ce62efc81dda8f417dc2ce6db47627964fdfd5a4d19facaeacdd4c3862c7',
          poiMerkleroots: [
            '0a4a0b4b84674e81680a160a9fc80f4a91a0a11093b14eabcee94840cd146f5b',
          ],
          blindedCommitmentsOut: [],
          railgunTxidIfHasUnshield:
            '0x172e84f653931ef519aba9532812efb41e6f20979c54bd1b6031b1d2bd8c1d3a',
        },
      },
    };

    const validatedPOIData = await validatePOI(
      txidVersion,
      chain,
      contractTransaction,
      false, // useRelayAdapt
      pois,
    );

    expect(validatedPOIData).to.deep.equal({
      notePublicKey:
        '0x0630ebf7bb25061ed25456a453912fd502a5b8ebc19ca3f8b88cb51ef6b88c92',
      railgunTxid:
        '19ec9e458978c34cba0b4a00c17a7cb4a09f67decfca37faf40fb63dcb268871',
      utxoTreeIn: 0,
      commitment:
        '0x20574897cbb52d5aeb5786cf1ae005063c5b5bda033591d064c384de898daa8f',
      preTransactionPOIsPerTxidLeafPerList: pois,
    });
  }).timeout(20000);
});
