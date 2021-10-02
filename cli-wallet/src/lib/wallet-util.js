/*
  Utility library for working with wallet files.
*/

const fs = require('fs').promises
const BCHJS = require('@psf/bch-js')
const Conf = require('conf')

let _this // Global variable points at instance of this Class.

class WalletUtil {
  constructor (localConfig = {}) {
    this.fs = fs
    this.bchjs = new BCHJS()
    this.conf = new Conf()

    _this = this
  }

  // Save the wallet data into a .json text file.
  async saveWallet (filename, walletData) {
    await _this.fs.writeFile(filename, JSON.stringify(walletData, null, 2))

    return true
  }

  // Generates an array of HD addresses.
  // Address are generated from index to limit.
  // e.g. generateAddress(walletData, 20, 10)
  // will generate a 10-element array of addresses from index 20 to 29
  async generateAddress (walletData, index, limit) {
    // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

    if (!walletData.mnemonic) throw new Error('mnemonic is undefined!')

    // root seed buffer
    const rootSeed = await this.bchjs.Mnemonic.toSeed(walletData.mnemonic)

    // master HDNode
    const masterHDNode = this.bchjs.HDNode.fromSeed(rootSeed)

    // HDNode of BIP44 account
    const account = this.bchjs.HDNode.derivePath(
      masterHDNode,
      `m/44'/${walletData.derivation}'/0'`
    )

    // Empty array for collecting generated addresses
    const bulkAddresses = []

    // Generate the addresses.
    for (let i = index; i < index + limit; i++) {
      // derive an external change address HDNode
      const change = this.bchjs.HDNode.derivePath(account, `0/${i}`)

      // get the cash address
      const newAddress = this.bchjs.HDNode.toCashAddress(change)
      // const legacy = this.bchjs.HDNode.toLegacyAddress(change)

      // push address into array
      bulkAddresses.push(newAddress)
    }

    return bulkAddresses
  }

  // Retrieves the 12-word menomnic used for e2e encryption with the wallet
  // service. If it doesn't exist in the config, then it will be created.
  getEncryptionMnemonic () {
    let e2eeMnemonic = this.conf.get('e2eeMnemonic', false)

    // If the mnemonic doesn't exist, generate it and save to the config.
    if (!e2eeMnemonic) {
      const mnemonic = this.bchjs.Mnemonic.generate(
        128,
        this.bchjs.Mnemonic.wordLists().english
      )

      this.conf.set('e2eeMnemonic', mnemonic)

      e2eeMnemonic = mnemonic
    }

    return e2eeMnemonic
  }
}

module.exports = WalletUtil
