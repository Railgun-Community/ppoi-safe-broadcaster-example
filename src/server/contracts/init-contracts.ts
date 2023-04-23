import { RelayerChain } from '../../models/chain-models';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configNetworks from '../config/config-networks';
import { getProviderForNetwork } from '../providers/active-network-providers';
import { ContractStore } from './contract-store';
import { PaymasterContract } from './paymaster-contract';

export const initContracts = (chains?: RelayerChain[]): void => {
  const initChains = chains ?? configuredNetworkChains();

  initChains.forEach((chain) => {
    try {
      initContractsForNetwork(chain);
    } catch (err) {
      throw new Error(
        `Could not initialize contracts for chain: ${chain.type}:${chain.id} - ${err.message}`,
      );
    }
  });
};

const initContractsForNetwork = (chain: RelayerChain): void => {
  const network = configNetworks[chain.type][chain.id];
  if (!network) {
    return;
  }

  const provider = getProviderForNetwork(chain);

  const paymasterContractAddress = network.paymasterContract;
  if (!paymasterContractAddress) {
    throw new Error(
      `No paymaster contract for network ${chain.type}:${chain.id}`,
    );
  }

  const paymasterContract = new PaymasterContract(
    paymasterContractAddress,
    provider,
  );
  ContractStore.paymasterContracts[chain.type] ??= [];
  ContractStore.paymasterContracts[chain.type][chain.id] = paymasterContract;
};
