
class FeeUseCases {
  constructor(localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Fee Use Cases library.'
      )
    }
  }

  getFee() {
    return 10;
  }
}

module.exports = FeeUseCases;
