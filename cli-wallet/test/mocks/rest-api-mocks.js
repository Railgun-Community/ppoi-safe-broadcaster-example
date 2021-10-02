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

module.exports = {
  rpcData
}
