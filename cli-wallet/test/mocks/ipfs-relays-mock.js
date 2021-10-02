/** Mocks for response of ipfs relays status */
const ipfsRelays = [
  {
    multiaddr:
      '/ip4/165.227.82.120/tcp/5668/p2p/QmWi3WGdnV5VSpaeJQ2hwJztfarkRsHFXb7ZrjBYaGfJE6',
    connected: false,
    updatedAt: '2021-09-03T13:33:32.418Z',
    ipfsId: 'QmZ2YiP5jgeHAXJkzszCtojUw3P2DdrZK41uzWQVKHd9kQ',
    isBootstrap: true,
    metrics: {
      aboutLatency: []
    },
    latencyScore: 10000
  },
  {
    multiaddr:
      '/ip4/157.90.28.11/tcp/4001/p2p/QmSNwrec3GjpzLA8coJiSzdrGzKMELDBjsnsqwkNXDJWz6',
    connected: false,
    updatedAt: '2021-09-03T13:33:34.123Z',
    ipfsId: 'QmSNwrec3GjpzLA8coJiSzdrGzKMELDBjsnsqwkNXDJWz6',
    isBootstrap: true,
    metrics: {
      aboutLatency: []
    },
    latencyScore: 10000
  }
]
module.exports = ipfsRelays
