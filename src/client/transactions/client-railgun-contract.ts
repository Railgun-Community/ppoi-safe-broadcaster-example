import { NetworkChainID } from '../../server/config/config-chain-ids';
import { getLepton } from '../../server/lepton/lepton-init';

export const getContractForNetwork = (chainID: NetworkChainID) => {
  const contract = getLepton().contracts[chainID];
  if (!contract) {
    throw new Error(`Lepton contract not yet loaded for chain ${chainID}`);
  }
  return contract;
};
