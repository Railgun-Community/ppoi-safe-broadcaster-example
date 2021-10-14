/*
  List and/or select a wallet service provider.
*/

// Public NPM libraries
const axios = require('axios')
const Conf = require('conf')

const { Command, flags } = require('@oclif/command')

class RailgunService extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.axios = axios
    this.conf = new Conf()
  }

  async run () {
    try {
      const { flags } = this.parse(RailgunService)

      const servicePeers = await this.getServicePeers(flags)

      console.log(`Railgun service peers: ${JSON.stringify(servicePeers, null, 2)}`)

      return true
    } catch (err) {
      console.log('Error in run(): ', err)

      return false
    }
  }

  // Get a list of Railgun relays that can provide services to this node.
  async getServicePeers (flags) {
    try {
      // Get a list of the IPFS peers this node is connected to.
      const result = await this.axios.post('http://localhost:5000/local/', {
        peers: true
      })
      const peers = result.data
      // console.log(`Subnet Peers: ${JSON.stringify(result.data, null, 2)}`);
      // console.log(`Number of peers: ${result.data.length}`)

      // Filter the wallet services from the peers.
      const servicePeers = peers.filter((x) => {
        if (!x.protocol) return false

        return x.protocol.includes('railgun-relayer')
      })

      if (flags.select) this.selectService(servicePeers, flags)

      // Get the IPFS ID for the currently selected wallet service.
      const serviceId = this.conf.get('selectedService')
      // console.log('serviceId: ', serviceId);

      // Add the isSelected flag.
      servicePeers.map((x) => {
        x.isSelected = x.peer.includes(serviceId)
        return x
      })

      return servicePeers
    } catch (err) {
      console.error('Error in getServicePeers()')
      throw err
    }
  }

  // Select a different peer to use as a wallet service.
  selectService (servicePeers, flags) {
    try {
      // console.log('servicePeers: ', JSON.stringify(servicePeers, null, 2));
      // console.log('flags: ', JSON.stringify(flags, null, 2));

      const chosenPeer = flags.select

      // Loop through the available wallet service peers.
      for (let i = 0; i < servicePeers.length; i++) {
        const thisPeer = servicePeers[i]

        // If the chosen ID is found in the list, select it.
        if (thisPeer.peer.includes(chosenPeer)) {
          this.conf.set('selectedService', chosenPeer)

          return true
        }
      }

      return false
    } catch (err) {
      console.log('Error in selectService()')
      throw err
    }
  }
}

RailgunService.description = 'List and/or select a wallet service provider.'

RailgunService.flags = {
  select: flags.string({
    char: 's',
    description: 'Switch to a given IPFS ID for wallet service.'
  })
}

module.exports = RailgunService
