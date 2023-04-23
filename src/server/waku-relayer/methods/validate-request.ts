import {
  getRailgunWalletAddressData,
  hexlify,
} from '@railgun-community/quickstart';
import {
  networkForChain,
  versionCompare,
} from '@railgun-community/shared-models';
import { Debugger } from 'debug';
import { getRelayerVersion } from '../../../util/relayer-version';
import configDefaults from '../../config/config-defaults';
import { recognizesFeeCacheID } from '../../fees/transaction-fee-cache';
import { getRailgunWalletAddress } from '../../wallets/active-wallets';
import { RelayerChain } from '../../../models/chain-models';

export const validateRequest = (
  dbg: Debugger,
  chain: RelayerChain,
  minVersion: string,
  maxVersion: string,
  relayerViewingKey: string,
  feeCacheID: string,
) => {
  const network = networkForChain(chain);
  if (!network) {
    dbg(`Cannot process tx - Unrecognized chain`);
    return false;
  }

  if (!minVersion || !maxVersion) {
    dbg(`Cannot process tx - Requires params minVersion, maxVersion`);
    return false;
  }
  const relayerVersion = getRelayerVersion();
  const incorrectVersion =
    versionCompare(relayerVersion, minVersion) < 0 ||
    versionCompare(relayerVersion, maxVersion) > 0;
  if (incorrectVersion) {
    dbg(
      `Cannot process tx - Relayer version ${relayerVersion} outside range ${minVersion}-${maxVersion}`,
    );
    return false;
  }

  const railgunWalletAddress = getRailgunWalletAddress();
  const { viewingPublicKey } =
    getRailgunWalletAddressData(railgunWalletAddress);
  if (!relayerViewingKey || relayerViewingKey !== hexlify(viewingPublicKey)) {
    dbg(`Cannot process tx - Invalid relayer viewing key`);
    return false;
  }

  if (
    feeCacheID &&
    configDefaults.transactionFees.requireMatchingFeeCacheID &&
    !recognizesFeeCacheID(chain, feeCacheID)
  ) {
    dbg(
      'Fee cache ID unrecognized. Transaction sent to another Relayer with same Railgun Address.',
    );
    return false;
  }

  return true;
};
