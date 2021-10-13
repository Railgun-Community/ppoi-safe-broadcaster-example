/*
  Mock data for the rest-api.unit.js unit tests.
*/

const rpcData = {
  id: '123',
  result: {
    value: {
      success: true,
      balances: [
        {
          balance: {},
          address: 'addressString'
        }
      ]
    }
  }
}

const mockRelayData = [
  {
    multiaddr: '/ip4/139.162.76.54/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    connected: true,
    updatedAt: '2021-10-11T15:59:31.701Z',
    ipfsId: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    isBootstrap: false,
    metrics: {
      aboutLatency: [596, 769, 1029]
    },
    latencyScore: 682
  },
  {
    multiaddr: '/ip4/143.198.60.119/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    connected: true,
    updatedAt: '2021-10-11T15:59:31.701Z',
    ipfsId: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    isBootstrap: false,
    metrics: {
      aboutLatency: [1080, 530, 1137]
    },
    latencyScore: 805
  },
  {
    multiaddr: '/ip4/143.198.60.119/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKq',
    connected: true,
    updatedAt: '2021-10-11T15:59:31.701Z',
    ipfsId: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKq',
    isBootstrap: false,
    metrics: {
      aboutLatency: [1080, 530, 1137]
    },
    latencyScore: 805
  }
]

const mockPeerData = [
  {
    from: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    channel: 'psf-ipfs-coordination-001',
    data: {
      apiName: 'ipfs-coord-announce',
      apiVersion: '1.3.2',
      apiInfo: 'You should put an IPFS hash or web URL here to your documentation.',
      broadcastedAt: '2021-10-11T15:59:59.598Z',
      ipfsId: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
      type: 'node.js',
      ipfsMultiaddrs: [
        '/ip4/127.0.0.1/tcp/5268/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
        '/ip4/127.0.0.1/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
        '/ip4/139.162.76.54/tcp/5268/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
        '/ip4/139.162.76.54/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77'
      ],
      orbitdb:
        '/orbitdb/zdpuApooyo2rWMuDkuTrEcxQghJKzmyQSpfUEvBhx45UNgLJX/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK7721101115',
      circuitRelays: [],
      isCircuitRelay: true,
      cryptoAddresses: [
        {
          blockchain: 'BCH',
          type: 'cashAddr',
          address: 'bitcoincash:qpsaewu50nnm9gjn7e0ejmusrflfd8lrdy8szg2564'
        },
        {
          blockchain: 'BCH',
          type: 'slpAddr',
          address: 'simpleledger:qpsaewu50nnm9gjn7e0ejmusrflfd8lrdyttfnl5yt'
        }
      ],
      encryptPubKey: '0338122208e2842f39afabd23deadbe2acfdcbe69d127c24835e05603771f1e85d',
      jsonLd: {
        '@context': 'https://schema.org/',
        '@type': 'WebAPI',
        name: 'ipfs-relay-tokyo-pfs-0945772',
        version: '1.3.0',
        protocol: 'generic-service',
        description:
          'This is a generic IPFS Serivice Provider that uses JSON RPC over IPFS to communicate with it. This instance has not been customized. Source code: https://github.com/Permissionless-Software-Foundation/ipfs-service-provider',
        documentation: 'https://ipfs-service-provider.fullstack.cash/',
        provider: {
          '@type': 'Organization',
          name: 'Permissionless Software Foundation',
          url: 'https://PSFoundation.cash'
        },
        identifier: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77'
      },
      updatedAt: '2021-10-11T15:59:59.857Z'
    }
  },
  {
    from: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    channel: 'psf-ipfs-coordination-001',
    data: {
      apiName: 'ipfs-coord-announce',
      apiVersion: '1.3.2',
      apiInfo: 'You should put an IPFS hash or web URL here to your documentation.',
      broadcastedAt: '2021-10-11T15:59:51.277Z',
      ipfsId: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
      type: 'node.js',
      ipfsMultiaddrs: [
        '/ip4/10.124.0.2/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/10.124.0.2/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/10.48.0.5/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/10.48.0.5/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/127.0.0.1/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/127.0.0.1/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/143.198.60.119/tcp/4001/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
        '/ip4/143.198.60.119/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp'
      ],
      orbitdb:
        '/orbitdb/zdpuAxU8itEdbqjDxCeF3C5pRN9HSXmtivJi7ygMhnew3nAPf/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp21101011',
      circuitRelays: [],
      isCircuitRelay: true,
      circuitRelayInfo: {
        ip4: '143.198.60.119',
        tcpPort: '4001',
        crDomain: 'relayer.fullstackcash.nl'
      },
      cryptoAddresses: [
        {
          blockchain: 'BCH',
          type: 'cashAddr',
          address: 'bitcoincash:qzyvlftxcmwwca6qgg3l0zqqrk33hlcxhcpuv84awv'
        },
        {
          blockchain: 'BCH',
          type: 'slpAddr',
          address: 'simpleledger:qzyvlftxcmwwca6qgg3l0zqqrk33hlcxhcd88uqasj'
        }
      ],
      encryptPubKey: '038264a85c945601ce96a5727f6ec524f16b3228fffd7c2d26ce047111be5598ad',
      jsonLd: {
        '@context': 'https://schema.org/',
        '@type': 'WebAPI',
        name: 'trout-dev-railgun-relay',
        version: '1.0.1',
        protocol: 'railgun-relayer',
        description: 'This is a generic Railgun Relayer. It has not been customized.',
        documentation: 'https://www.railgun.org/',
        provider: {
          '@type': 'Organization',
          name: 'Railgun DAO',
          url: 'https://www.railgun.org/'
        },
        identifier: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp'
      },
      updatedAt: '2021-10-11T15:59:51.430Z'
    }
  }
]

const ipfsMockPeers = [
  {
    addr: '/ip4/139.162.76.54/tcp/5269/ws/p2p/QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    peer: 'QmaKzQTAtoJWYMiG5ATx41uWsMajr1kSxRdtg919s8fK77',
    direction: 'outbound',
    muxer: '/mplex/6.7.0',
    latency: 'n/a',
    streams: []
  },
  {
    addr: '/ip4/143.198.60.119/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    peer: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKp',
    direction: 'outbound',
    muxer: '/mplex/6.7.0',
    latency: 'n/a',
    streams: []
  },
  // This data is used to exercise some of the exception code paths.
  {
    addr: '/ip4/143.198.60.119/tcp/4003/ws/p2p/QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKo',
    peer: 'QmcewynF2DMxuvK7zk1E5es1cvBwZrfnYEaiN995KVYaKo',
    direction: 'outbound',
    muxer: '/mplex/6.7.0',
    latency: 'n/a',
    streams: []
  }
]

module.exports = {
  rpcData,
  mockRelayData,
  mockPeerData,
  ipfsMockPeers
}
