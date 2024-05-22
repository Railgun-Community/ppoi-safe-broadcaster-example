import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { EVMGasType, ChainType } from '@railgun-community/shared-models';
import { GasHistoryPercentile } from '../../../models/gas-models';
import { getGasDetailsForSpeed } from '../gas-by-speed';
import { NetworkChainID } from '../../config/config-chains';
import { BroadcasterChain } from '../../../models/chain-models';
import { initNetworkProviders } from '../../providers/active-network-providers';

chai.use(chaiAsPromised);
const { expect } = chai;

const chain: BroadcasterChain = {
  type: ChainType.EVM,
  id: NetworkChainID.PolygonPOS,
};

describe('gas-by-speed', () => {
  before(async () => {
    await initNetworkProviders([chain]);
  });

  it('Should calculate gas speeds from RPC - Type0', async () => {
    await Promise.all(
      Object.values(GasHistoryPercentile)
        .filter((v) => !Number.isNaN(Number(v)))
        .map(async (percentile) => {
          const gasDetails = await getGasDetailsForSpeed(
            EVMGasType.Type0,
            chain,
            percentile as GasHistoryPercentile,
          );
          if (gasDetails.evmGasType !== EVMGasType.Type0) {
            throw new Error('Incorrect gas type');
          }
          expect(Number(gasDetails.gasPrice)).to.be.greaterThan(1_000_000_000);
          expect(Number(gasDetails.gasPrice)).to.be.lessThan(3_500_000_000_000);
        }),
    );
  });

  it('Should calculate gas speeds from RPC - Type2', async () => {
    await Promise.all(
      Object.values(GasHistoryPercentile)
        .filter((v) => !Number.isNaN(Number(v)))
        .map(async (percentile) => {
          const gasDetails = await getGasDetailsForSpeed(
            EVMGasType.Type2,
            chain,
            percentile as GasHistoryPercentile,
          );
          if (gasDetails.evmGasType !== EVMGasType.Type2) {
            throw new Error('Incorrect gas type');
          }
          expect(Number(gasDetails.maxFeePerGas)).to.be.greaterThan(
            1_000_000_000,
          );
          expect(Number(gasDetails.maxFeePerGas)).to.be.lessThan(
            3_500_000_000_000,
          );
          expect(Number(gasDetails.maxPriorityFeePerGas)).to.be.greaterThan(
            1_000_000_000,
          );
          expect(Number(gasDetails.maxPriorityFeePerGas)).to.be.lessThan(
            3_500_000_000_000,
          );
        }),
    );
  });
});
