import {
  Chain,
  SingleCommitmentProofsData,
  TXIDVersion,
  delay,
  isDefined,
  networkForChain,
  removeUndefineds,
} from '@railgun-community/shared-models';
import { ValidatedPOIData } from './poi-validator';
import { RelayerChain } from '../../models/chain-models';
import debug from 'debug';
import {
  ByteLength,
  Database,
  POINodeRequest,
  formatToByteLength,
  getRailgunTransactionsForTxid,
  refreshReceivePOIsForWallet,
  walletForID,
} from '@railgun-community/wallet';
import { getRailgunWalletID } from '../wallets/active-wallets';
import { configuredNetworkChains } from '../chains/network-chain-ids';
import configDefaults from '../config/config-defaults';
import leveldown from 'leveldown';

const dbg = debug('relayer:poi-assurance');

const POI_ASSURANCE_NAMESPACE = 'poi-assurance';

type StoredValidatedPOI = {
  txid: string;
  validatedPOIData: ValidatedPOIData;
};

export class POIAssurance {
  private static db: Optional<Database>;

  static init() {
    const level = leveldown(configDefaults.poi.dbDir);
    this.db = new Database(level);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.pollSubmitValidatedPOIs();
  }

  static async deinit() {
    await this.db?.close();
  }

  private static async pollSubmitValidatedPOIs() {
    for (const txidVersion of Object.values(TXIDVersion)) {
      for (const chain of configuredNetworkChains()) {
        // eslint-disable-next-line no-await-in-loop
        await this.submitValidatedPOIs(txidVersion, chain);
      }
    }

    await delay(2 * 60 * 1000); // 2 minutes

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.pollSubmitValidatedPOIs();
  }

  private static async keySplits(
    namespace: string[],
    fieldCount: number,
  ): Promise<string[][]> {
    if (!this.db) {
      throw new Error('Call POIAssurance.init first to initialize DB');
    }
    const keys: string[] = await this.db.getNamespaceKeys(namespace);
    const keySplits = keys
      .map((key) => key.split(':'))
      .filter((keySplit) => keySplit.length === fieldCount);
    return keySplits;
  }

  static async queueValidatedPOI(
    txidVersion: TXIDVersion,
    chain: RelayerChain,
    txid: string,
    validatedPOIData: ValidatedPOIData,
  ): Promise<void> {
    try {
      if (!this.db) {
        throw new Error('Call POIAssurance.init first to initialize DB');
      }

      const storedValidatedPOI: StoredValidatedPOI = {
        txid,
        validatedPOIData,
      };

      const namespace = this.getNamespace(txidVersion, chain, txid);
      await this.db.put(namespace, storedValidatedPOI, 'json');
    } catch (err) {
      dbg(`Could not queue validated POI: ${err.message}`);
    }
  }

  private static getNamespace(
    txidVersion: TXIDVersion,
    chain: RelayerChain,
    txid?: string,
  ): string[] {
    const namespace = [
      POI_ASSURANCE_NAMESPACE,
      txidVersion,
      String(chain.type),
      String(chain.id),
    ];
    if (isDefined(txid)) {
      namespace.push(txid);
    }
    return namespace;
  }

  static async getValidatedPOIs(
    txidVersion: TXIDVersion,
    chain: RelayerChain,
  ): Promise<StoredValidatedPOI[]> {
    try {
      // poi-assurance:txidVersion:chainType:chainId:DATA
      const namespace = this.getNamespace(txidVersion, chain);
      const keySplits = await this.keySplits(namespace, 5);

      const validatedPOIs: StoredValidatedPOI[] = removeUndefineds(
        await Promise.all(
          keySplits.map(async (keySplit) => {
            if (!this.db) {
              throw new Error('Call POIAssurance.init first to initialize DB');
            }
            return (await this.db.get(keySplit, 'json')) as StoredValidatedPOI;
          }),
        ),
      );
      return validatedPOIs;
    } catch (err) {
      dbg(`Could not get validated POIs: ${err.message}`);
      return [];
    }
  }

  static async deleteValidatedPOI(
    txidVersion: TXIDVersion,
    chain: RelayerChain,
    txid: string,
  ) {
    try {
      if (!this.db) {
        throw new Error('Call POIAssurance.init first to initialize DB');
      }

      const namespace = this.getNamespace(txidVersion, chain, txid);
      await this.db.del(namespace);
    } catch (err) {
      dbg(`Could not delete validated POI: ${err.message}`);
    }
  }

  private static async submitValidatedPOIs(
    txidVersion: TXIDVersion,
    chain: Chain,
  ) {
    try {
      const walletID = getRailgunWalletID();

      const validatedPOIs = await this.getValidatedPOIs(txidVersion, chain);

      if (validatedPOIs.length) {
        const network = networkForChain(chain);
        if (!network) {
          throw new Error('Network not found');
        }
        await refreshReceivePOIsForWallet(txidVersion, network.name, walletID);
      }

      const wallet = walletForID(walletID);
      const spendableReceivedTxids = (
        await wallet.getSpendableReceivedChainTxids(txidVersion, chain)
      ).map((txid) => formatToByteLength(txid, ByteLength.UINT_256));

      for (const validatedPOI of validatedPOIs) {
        const txidFormatted = formatToByteLength(
          validatedPOI.txid,
          ByteLength.UINT_256,
        );
        if (spendableReceivedTxids.includes(txidFormatted)) {
          dbg('TXID is spendable - deleting validated POI');
          // eslint-disable-next-line no-await-in-loop
          await this.deleteValidatedPOI(txidVersion, chain, validatedPOI.txid);
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await this.submitValidatedPOI(txidVersion, chain, validatedPOI);
      }
    } catch (err) {
      dbg(
        `Could not submit validated POI ${chain.type}:${chain.id} for ${txidVersion}: ${err.message}`,
      );
    }
  }

  private static async submitValidatedPOI(
    txidVersion: TXIDVersion,
    chain: Chain,
    validatedPOI: StoredValidatedPOI,
  ) {
    if (!configDefaults.poi.nodeURL) {
      throw new Error('No poi nodeURL configured');
    }

    const { txid } = validatedPOI;
    const {
      railgunTxid,
      utxoTreeIn,
      commitment,
      notePublicKey,
      preTransactionPOIsPerTxidLeafPerList,
    } = validatedPOI.validatedPOIData;

    try {
      const poiNodeRequest = new POINodeRequest(configDefaults.poi.nodeURL);

      const railgunTransactions = await getRailgunTransactionsForTxid(
        chain,
        txid,
      );
      if (railgunTransactions.length === 0) {
        // Likely TXID tree is not synced yet.
        return;
      }
      const railgunTransaction = railgunTransactions.find((tx) => {
        return tx.commitments[0] === commitment;
      });
      if (!railgunTransaction) {
        throw new Error('No railgun transaction found for commitment');
      }

      const singleCommitmentProofsData: SingleCommitmentProofsData = {
        commitment,
        npk: notePublicKey,
        utxoTreeIn,
        utxoTreeOut: railgunTransaction.utxoTreeOut,
        utxoPositionOut: railgunTransaction.utxoBatchStartPositionOut, // first commitment position.
        railgunTxid,
        pois: preTransactionPOIsPerTxidLeafPerList,
      };

      // eslint-disable-next-line no-await-in-loop
      await poiNodeRequest.submitSingleCommitmentProof(
        txidVersion,
        chain,
        singleCommitmentProofsData,
      );

      dbg('Submitted single commitment proof to POI node');
    } catch (err) {
      dbg(
        `Could not submit validated POI for railgun txid ${railgunTxid} ${chain.type}:${chain.id} for ${txidVersion}: ${err.message}`,
      );
    }
  }
}
