const DEFAULT_COORDINATION_ROOM = 'psf-ipfs-coordination-001'

let _this

class TimerControllers {
  constructor(localConfig = {}) {
    // Dependency Injection
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters required when instantiating Timer Controllers'
      )
    }

    localConfig.statusLog = console.log; // @todo add real logger and replace everywhere
    this.statusLog = localConfig.statusLog
    if (!this.statusLog) {
      throw new Error(
        'Handler for status logs required when instantiating Timer Controllers'
      )
    }

    this.debugLevel = localConfig.debugLevel

    _this = this
  }

  startTimers(thisNode, useCases) {
    // Periodically announce this nodes existance to the network.
    this.announceFeesTimerHandle = setInterval(async function () {
      console.log("--> Announcing Fees")
      await _this.manageFeeAnnouncement(thisNode, useCases)
    }, 30000)

    return {
      announceFeesTimerHandle: this.announceFeesTimerHandle,
    }
  }

  async manageAnnouncement(thisNode, useCases) {
    try {
      // console.log('thisNode: ', thisNode)

      // object indexed by chainID containing pairs of address: unitsPerGwei
      const fees = {
        1: {
          '0x6b175474e89094c44da98b954eedeac495271d0f': 1,
        }
      }

      // Get the information needed for the announcement.
      const announceFeesObj = {
        ipfsId: thisNode.ipfsId,
        ipfsMultiaddrs: thisNode.ipfsMultiaddrs,
        type: thisNode.type,
        orbitdbId: thisNode.orbit.id,
        // TODO: Allow node.js apps to pass a config setting to override this.
        isCircuitRelay: false,
        fees,
      }

      console.log(announceFeesObj);

      // Generate the announcement message.
      // const announceFeesMsgObj = thisNode.schema.announcement(announceObj) // probably important
      // console.log(`announceMsgObj: ${JSON.stringify(announceMsgObj, null, 2)}`)

      const announceFeesMsgStr = JSON.stringify(announceFeesObj)
      // const announceFeesMsgStr = JSON.stringify(announceFeesMsgObj)

      // Publish the announcement to the pubsub channel.
      await this.adapters.pubsub.publishToPubsubChannel(
        DEFAULT_COORDINATION_ROOM,
        announceFeesMsgStr
      )

      if (this.debugLevel) {
        const now = new Date()
        this.statusLog(
          `status: Announced fees on ${DEFAULT_COORDINATION_ROOM} pubsub channel at ${now.toLocaleString()}`
        )
      }

      return true
    } catch (err) {
      // console.error('Error in timer-controller.js/manageAnnouncement(): ', err)
      this.adapters.log.statusLog(
        2,
        'Error in timer-controller.js/manageFeesAnnouncement(): ',
        err
      )
      // Note: Do not throw an error. This is a top-level function.
    }
  }
}

module.exports = TimerControllers
