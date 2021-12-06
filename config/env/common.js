/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

// Set the human-readable name that identifies this node in the IPFS subnetwork.
const ipfsCoordName = process.env.COORD_NAME
  ? process.env.COORD_NAME
  : "ipfs-railgun-wallet-service";
console.log("Human readible IPFS handle: ", ipfsCoordName);

// Get the version from the package.json file.
const pkgInfo = require("../../package.json");

const { version } = pkgInfo;

module.exports = {
  // IPFS settings.
  isCircuitRelay: !!process.env.ENABLE_CIRCUIT_RELAY,
  // SSL domain used for websocket connection via browsers.
  crDomain: process.env.CR_DOMAIN ? process.env.CR_DOMAIN : "",

  // IPFS Ports
  ipfsTcpPort: process.env.IPFS_TCP_PORT ? process.env.IPFS_TCP_PORT : 4001,
  ipfsWsPort: process.env.IPFS_WS_PORT ? process.env.IPFS_WS_PORT : 4003,

  // BCH Mnemonic for generating encryption keys and payment address
  mnemonic: process.env.MNEMONIC ? process.env.MNEMONIC : "",
  pins: {
    wasm: 'QmW8TdpMXRrovAJCwEc6eBqTgYUUwsmLFBJ8EaLnKC9iSE', // wasm compressed
    zkey: 'QmdVGrmr9VvdwsEi9Kx8jYtsHePwKh89Miyp5smXnkAnh4', // zkey compressed
    vkey: 'QmSA6uoKHov79o4YMRYux7urybWJbP6CKZaw8mT5zp2AV9', // vkey compressed
  },
  pinTimeout: 1000 * 60 * 2,

  // JSON-LD and Schema.org schema with info about this app.
  announceJsonLd: {
    "@context": "https://schema.org/",
    "@type": "WebAPI",
    name: ipfsCoordName,
    version,
    protocol: "railgun-relayer",
    description:
      "This is a generic Railgun Relayer. It has not been customized.",
    documentation: "https://www.railgun.org/",
    provider: {
      "@type": "Organization",
      name: "Railgun DAO",
      url: "https://www.railgun.org/"
    }
  },

  debugLevel: process.env.DEBUG_LEVEL ? parseInt(process.env.DEBUG_LEVEL) : 1,

  // Railgun - Whitelist of contracts to send to.
  addrWhitelist: ["0x78d3bcdd9ae4b5f26bd60cd8014412528f68a4a7"]
};
