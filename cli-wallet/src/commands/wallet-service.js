/*
  List and/or select a wallet service provider.
*/

// Public NPM libraries
const axios = require('axios')
const Conf = require('conf')

const { Command, flags } = require('@oclif/command')

class WalletService extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.axios = axios
    this.conf = new Conf()
  }

  async run () {
    try {
      const { flags } = this.parse(WalletService)

      // Get a list of the IPFS peers this node is connected to.
      const result = await this.axios.post('http://localhost:5000/local/', {
        peers: true
        // all: flags.all,
      })
      const peers = result.data
      // console.log(`Subnet Peers: ${JSON.stringify(result.data, null, 2)}`)
      // console.log(`Number of peers: ${result.data.length}`)

      // Filter the wallet services from the peers.
      const servicePeers = peers.filter(x => {
        if (!x.protocol) return false

        return x.protocol.includes('bch-wallet')
      })

      if (flags.select) this.selectService(servicePeers, flags)

      // Get the IPFS ID for the currently selected wallet service.
      const serviceId = this.conf.get('selectedService')
      console.log('serviceId: ', serviceId)

      // Add the isSelected flag.
      servicePeers.map(x => {
        x.isSelected = x.peer.includes(serviceId)
        return x
      })

      console.log(
        `Wallet service peers: ${JSON.stringify(servicePeers, null, 2)}`
      )

      return true
    } catch (err) {
      console.log('Error in run(): ', err)

      return false
    }
  }

  // Select a different peer to use as a wallet service.
  selectService (servicePeers, flags) {
    try {
      const chosenPeer = flags.select

      // Loop through the available wallet service peers.
      for (let i = 0; i < servicePeers.length; i++) {
        const thisPeer = servicePeers[i]

        // If the chosen ID is found in the list, select it.
        if (thisPeer.peer.includes(chosenPeer)) {
          this.conf.set('selectedService', chosenPeer)

          break
        }
      }
    } catch (err) {
      console.log('Error in selectService()')
      throw err
    }
  }
}

WalletService.description = 'List and/or select a wallet service provider.'

WalletService.flags = {
  select: flags.string({
    char: 's',
    description: 'Switch to a given IPFS ID for wallet service.'
  })
}

module.exports = WalletService
