/*
  Mock data for the ipfs-coord.unit.js unit tests.
*/

const peers = [
  'QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
  'QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN'
]

const peerData = [
  {
    from: 'QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
    channel: 'psf-ipfs-coordination-001',
    data: {
      apiName: 'ipfs-coord-announce',
      apiVersion: '1.3.2',
      apiInfo:
        'You should put an IPFS hash or web URL here to your documentation.',
      ipfsId: 'QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
      type: 'node.js',
      ipfsMultiaddrs: [
        '/ip4/127.0.0.1/tcp/5701/p2p/QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
        '/ip4/127.0.0.1/tcp/5702/ws/p2p/QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
        '/ip4/192.168.0.2/tcp/5701/p2p/QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2',
        '/ip4/192.168.0.2/tcp/5702/ws/p2p/QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2'
      ],
      orbitdb:
        '/orbitdb/zdpuAntCMCcmZuFy2hq5F7kpcti3yHa34LLZHzyVqorkoSpAJ/QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ221082417',
      circuitRelays: [],
      isCircuitRelay: false,
      cryptoAddresses: [
        {
          blockchain: 'BCH',
          type: 'cashAddr',
          address: 'bitcoincash:qru6kq3p4tv6z2lmy0n560lyhh3z2feay5gjzggc37'
        },
        {
          blockchain: 'BCH',
          type: 'slpAddr',
          address: 'simpleledger:qru6kq3p4tv6z2lmy0n560lyhh3z2feay5yffnac0q'
        }
      ],
      encryptPubKey:
        '021db6e97650659653ba61dd493dc348a7429cdcbafd4fb73b08b1223bf5bd98df',
      jsonLd: {
        '@context': 'https://schema.org/',
        '@type': 'WebAPI',
        name: 'trout-bch-wallet-service-dev',
        version: '1.11.1',
        protocol: 'bch-wallet',
        description:
          'IPFS service providing BCH blockchain access needed by a wallet.',
        documentation: 'https://ipfs-bch-wallet-service.fullstack.cash/',
        provider: {
          '@type': 'Organization',
          name: 'Permissionless Software Foundation',
          url: 'https://PSFoundation.cash'
        },
        identifier: 'QmWkjYRRTaxVEuGK8ip2X3trVyJShFs6U9g1h9x6fK5mZ2'
      },
      updatedAt: '2021-08-24T23:13:19.306Z'
    }
  },
  {
    from: 'QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN',
    channel: 'psf-ipfs-coordination-001',
    data: {
      apiName: 'ipfs-coord-announce',
      apiVersion: '1.3.2',
      apiInfo: 'https://ipfs-service-provider.fullstack.cash/',
      ipfsId: 'QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN',
      type: 'node.js',
      ipfsMultiaddrs: [
        '/ip4/127.0.0.1/tcp/5668/p2p/QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN',
        '/ip4/127.0.0.1/tcp/5669/ws/p2p/QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN',
        '/ip4/172.17.0.4/tcp/5668/p2p/QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN',
        '/ip4/172.17.0.4/tcp/5669/ws/p2p/QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN'
      ],
      orbitdb:
        '/orbitdb/zdpuB2H7Eqv63qWnEisR9SkW71h1GHTu32xdvza4gjBtD9AD8/QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN21072122',
      circuitRelays: [],
      isCircuitRelay: false,
      cryptoAddresses: [
        {
          blockchain: 'BCH',
          type: 'cashAddr',
          address: 'bitcoincash:qq4pk63gngzxnnhne39n0sl7kn2ekhnxngm5fyrgyd'
        },
        {
          blockchain: 'BCH',
          type: 'slpAddr',
          address: 'simpleledger:qq4pk63gngzxnnhne39n0sl7kn2ekhnxngh0zlkg6n'
        }
      ],
      encryptPubKey:
        '037676cdeac8376a75c19f62b40aa06feebc788a6704e1a1d13dcf478d090d7205',
      jsonLd: {
        '@context': 'https://schema.org/',
        '@type': 'WebAPI',
        name: 'ipfs-bch-wallet-service-dsl',
        description:
          'IPFS service providing BCH blockchain access needed by a wallet.',
        documentation: 'https://ipfs-bch-wallet-service.fullstack.cash/',
        provider: {
          '@type': 'Organization',
          name: 'Permissionless Software Foundation',
          url: 'https://PSFoundation.cash'
        },
        identifier: 'QmQqjVVD3CS6zaJmoSdt6GwX1c1tD5T9FZas4qxLbru8xN'
      },
      updatedAt: '2021-08-24T23:13:20.411Z'
    }
  }
]

module.exports = {
  peers,
  peerData
}
