/*
  This is a top-level library that encapsulates all the additional Use Cases.
  The concept of Use Cases comes from Clean Architecture:
  https://troutsblog.com/blog/clean-architecture
*/

// Individual Use Case libraries
const FeeUseCases = require('./fee')

class UseCases {
  constructor(localConfig = {}) {
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Use Cases library.'
      )
    }

    // Instantiate the use-case libraries.
    this.fee = new FeeUseCases(localConfig)
  }
}

module.exports = UseCases
