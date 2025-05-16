import { ContractTransaction, getAddress, Interface, isHexString, type InterfaceAbi, type TransactionDescription } from 'ethers';
import { logger } from '../../util/logger';
import { ABI_RELAY_ADAPT } from '../abi/abi';
import type { BroadcasterChain } from '../../models/chain-models';
import configNetworks from '../config/config-networks';

export const createValidTransaction = (
  chain: BroadcasterChain,
  to: string,
  data: string,
  value?: bigint,
): ContractTransaction => {
  try {
    if (!isHexString(data)) {
      throw new Error('Invalid data field.');
    }
    const isProxyCall = checkIsProxyAddress(chain, to);
    const isRelayCall =  checkIsRelayAdaptAddress(chain, to);
    const validatedTo = isProxyCall || isRelayCall;

    if(!validatedTo){
      throw new Error("Invalid to address. Must be a known contract.")
    }

    if(isRelayCall){
      const decoded = decodeData(data, ABI_RELAY_ADAPT);
      if(decoded){
        const needsValidation = isCallToRelay(decoded);
        if(needsValidation){
          const validatedData = validateRelayCallData(decoded);
          if(!validatedData){
            throw new Error("Invalid Transaction Call.")
          }
        }
      }
    }
    const validTransaction: ContractTransaction = {
      to: getAddress(to),
      data,
      value,
    };

    return validTransaction;
  } catch (err) {
    logger.error(err);
    throw new Error('Could not create valid transaction object.');
  }
};

const decodeData = (data: string, abi: InterfaceAbi) => {
  const iface = new Interface(abi);
  try {
    const decoded = iface.parseTransaction({ data });
    return decoded;
  } catch {
    return null;
  }
};

const isCallToRelay = (decoded: TransactionDescription | null) =>{
  if (!decoded) return false;
  if (decoded.name !== "relay") return false;
  return true
}

const validateRelayCallData = (decoded: TransactionDescription) => {
  const invalid: boolean = decoded.args[1][1];
  return !invalid;
};

const checkIsProxyAddress = (
  chain: BroadcasterChain,
  address: string,
) =>{
  const { proxyContract } =
    configNetworks[chain.type][chain.id];
  return address.toLowerCase() === proxyContract.toLowerCase()

}

const checkIsRelayAdaptAddress = (
  chain: BroadcasterChain,
  address: string,
) =>{
  const { relayAdaptContract } =
    configNetworks[chain.type][chain.id];
  return address.toLowerCase() === relayAdaptContract.toLowerCase()
}
