import { Waku, WakuMessage, DefaultPubSubTopic } from 'js-waku';
import { JsonRpcPayload } from '@walletconnect/jsonrpc-types';
import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import {
  getProviderForNetwork,
  initNetworkProviders,
} from 'server/providers/active-network-providers';
import {
  ERC20Note,
  ERC20Transaction,
  Lepton,
  QuickSync,
} from '@railgun-community/lepton';
import { bytes } from '@railgun-community/lepton/dist/utils';
import { FallbackProvider } from '@ethersproject/providers';
import { Contract, ethers } from 'ethers';
import { abiForChainToken } from 'server/abi/abi';
import { Wallet } from '@railgun-community/lepton/dist/wallet';
import level from 'level';
import { artifactsGetter } from 'server/lepton/artifacts';
import { ArtifactsGetter } from '@railgun-community/lepton/dist/prover';
import { LeptonDebugger } from '@railgun-community/lepton/dist/models/types';
import { contentTopics } from 'server/waku-relayer/topics';
import debug from 'debug';
import { NetworkChainID } from './server/config/config-chain-ids';
import configDefaults from './server/config/config-defaults';

const dbg = debug('relayer:client');

// export const PubSubTopic = '/railgun/1/relayer/json';
export const PubSubTopic = DefaultPubSubTopic;

const processIncomingMessage = (msg: WakuMessage) => {
  const { payload, timestamp, payloadAsUtf8 } = msg;
  if (!payload || payload.length === 0 || !timestamp) return;

  const delay = Date.now() - timestamp.getTime();
  dbg(`(+${delay}ms) message received:`, JSON.parse(payloadAsUtf8));
};

const sendMessage = async (waku: Waku) => {
  const payload: JsonRpcPayload = formatJsonRpcRequest('greet', {
    name: 'railgun client',
  });
  const message = await WakuMessage.fromUtf8String(
    JSON.stringify(payload),
    contentTopics.greet(),
  );
  await waku.relay.send(message);
  dbg('sent message', {
    message,
    topic: waku.relay.pubSubTopic,
    topics: waku.relay.getTopics(),
  });
};

const updateFees = (chainID: NetworkChainID, message: WakuMessage) => {
  dbg('updateFees');
  if (message.contentTopic !== contentTopics.fees(chainID)) return;
  dbg('fees ok');

  const feeObj = JSON.parse(message.payloadAsUtf8);
  dbg('updated fees', feeObj);
};

const connect = async (): Promise<Waku> => {
  dbg('creating js-waku client');
  const waku = await Waku.create({
    // pubSubTopic: PubSubTopic,
    bootstrap: { default: true },
    libp2p: {
      addresses: { listen: ['/ip4/0.0.0.0/tcp/0/ws'] },
    },
  });
  dbg('waiting for remote peer');
  await waku.waitForRemotePeer();
  // dialing direct peer by dns address works until its address is stored and returned as ipv4
  // then it fails
  dbg('dialing direct peer');
  await waku.dial(configDefaults.directPeers[0]);
  dbg('peers: ', waku.relay.peers.keys());
  dbg('multiaddr', waku.getLocalMultiaddrWithID());
  dbg(`pubsubTopic: ${waku.relay.pubSubTopic}`);

  return waku;
};

const getBalance = async (wallet: Wallet, chainID: number): Promise<string> => {
  const balances = Object.values(await wallet.balances(chainID));
  if (balances.length) {
    return balances[0].balance.toString(10);
  }
  return '-1';
};

type RelayerClientOptions = {
  wallet: ethers.Wallet;
  waku: Waku;
  db: string;
  artifactsGetter: ArtifactsGetter;
  quickSync?: QuickSync;
  debugger?: LeptonDebugger;
  encryptionKey: string;
};
class RelayerClient {
  wallet: ethers.Wallet;
  waku: Waku;
  lepton: Lepton;
  railgunWallet?: Wallet;
  encryptionKey: string;

  constructor(
    wallet: ethers.Wallet,
    lepton: Lepton,
    waku: Waku,
    encryptionKey: string,
  ) {
    this.wallet = wallet;
    this.waku = waku;
    this.lepton = lepton;
    this.encryptionKey = encryptionKey;
  }

  static async init(options: RelayerClientOptions): Promise<RelayerClient> {
    const db = level(options.db);
    const lepton = new Lepton(
      db,
      options.artifactsGetter,
      options.quickSync,
      options.debugger,
    );
    const client = new RelayerClient(
      options.wallet,
      lepton,
      options.waku,
      options.encryptionKey,
    );
    return client;
  }
  async initWallet() {
    const walletID = await this.lepton.createWalletFromMnemonic(
      this.encryptionKey,
      this.wallet.mnemonic.phrase,
    );
    this.railgunWallet = this.lepton.wallets[walletID];
  }

  async getRailgunAddress(chainID: number) {
    const addresses = await this.railgunWallet?.addresses(chainID);
    if (addresses && addresses.length) {
      return addresses[0];
    }
  }

  async onScan(wallet: Wallet) {
    return new Promise((resolve) => wallet.once('scanned', resolve));
  }

  /**
   * A client can transact multiple token
   * if client is paying fee in the same token, as one of the
   * add a note addressed to relayer public key within the same ERC20Transaction and increase total
   * deposit/withdraw amount accordingly.
   * If paying fee in a different token, bundle a new ERC20Transaction with a single note addressed
   * to the relayer
   *
   */
  async generateWithdraw(token: string, chainID: number, amount: string) {
    if (!this.railgunWallet) await this.initWallet();
    dbg(`withdrawing ${amount}`);
    const publicKey = this.railgunWallet?.getKeypair(
      this.encryptionKey,
      0,
      false,
      chainID,
    ).pubkey as string;
    const transaction = new ERC20Transaction(token, chainID);
    transaction.outputs = [
      new ERC20Note(publicKey, bytes.random(16), amount, token),
    ];

    transaction.setWithdraw(amount);
    transaction.withdrawAddress = this.wallet.address;
    const serialized = await transaction.prove(
      this.lepton.prover,
      this.railgunWallet!,
      this.encryptionKey,
    );
    const transact = await this.lepton.contracts[chainID].transact([
      serialized,
    ]);
    return transact;
  }

  async deposit(token: string, chainID: number, amount: string) {
    const address = await this.getRailgunAddress(chainID);
    if (!address) throw Error('railgun wallet not initialized');

    dbg('depositing 100');

    const notes = [
      new ERC20Note(
        Lepton.decodeAddress(address).pubkey,
        bytes.random(16),
        '100',
        token,
      ),
    ];
    const populatedDeposit = await this.lepton.contracts[
      chainID
    ].generateDeposit(notes);
    await this.wallet.sendTransaction(populatedDeposit);
    await this.onScan(this.railgunWallet!);
    dbg(
      'balances after deposit',
      await getBalance(this.railgunWallet!, chainID),
    );
  }
}

const testTransaction = async () => {
  const chainID = 31337; // hardhat
  await initNetworkProviders();
  const provider = getProviderForNetwork(chainID);

  const ethersWallet = ethers.Wallet.fromMnemonic(
    'test test test test test test test test test test test junk',
  ).connect(provider);

  const waku = await connect();

  const { log, error } = console;
  const client = await RelayerClient.init({
    db: 'client.db',
    wallet: ethersWallet,
    waku: waku,
    artifactsGetter,
    encryptionKey: 'quack',
    quickSync: undefined,
    debugger: {
      log,
      error,
    } as LeptonDebugger,
  });
  await client.initWallet();

  const proxy = '0x0165878A594ca255338adfa4d48449f69242Eb8F';
  await client.lepton.loadNetwork(
    chainID,
    proxy,
    provider as FallbackProvider,
    0,
  );

  const token = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const railgunProxyContract = client.lepton.contracts[chainID].contract;

  const tokenContract = new Contract(
    token,
    abiForChainToken(chainID),
    client.wallet,
  );
  await tokenContract.approve(railgunProxyContract.address, 1000n ** 18n);

  // const railgunWallet = getShieldedReceiverWallet();
  const railgunWallet = client.railgunWallet!;
  const address = (await railgunWallet.addresses(chainID))[0];

  dbg('railgunAddress', address);

  dbg('balance', await getBalance(railgunWallet, chainID));

  await client.deposit(token, chainID, '100');
  const transaction = await client.generateWithdraw(token, chainID, '50');

  const transactRequest = formatJsonRpcRequest('transact', {
    transaction,
    chainID,
  });
  const message = await WakuMessage.fromUtf8String(
    JSON.stringify(transactRequest),
    contentTopics.transact(),
  );
  dbg(message.contentTopic, chainID, transactRequest.id);
  // await client.waku.relay.send(message);

  await ethersWallet.sendTransaction(transaction); // works
  await client.onScan(railgunWallet);
  dbg('balances after withdraw', await getBalance(railgunWallet, chainID));
};

const initWaku = async () => {
  dbg('connecting to waku..');
  const waku = await connect();
  dbg('connected');

  const chainIDs = [NetworkChainID.HardHat, NetworkChainID.Ropsten];
  chainIDs.forEach((chainID) =>
    waku.relay.addObserver(
      (message: WakuMessage) => updateFees(chainID, message),
      [contentTopics.fees(chainID)],
    ),
  );
  waku.relay.addObserver(processIncomingMessage, [contentTopics.greet()]);

  await sendMessage(waku);
  setInterval(sendMessage, 10000 * 10, waku);
  dbg('observing contentTopics:', waku.relay.observers);
};

const main = async () => {
  await initWaku();
  dbg('starting client');
  await testTransaction();
  dbg('done');
};

main();
