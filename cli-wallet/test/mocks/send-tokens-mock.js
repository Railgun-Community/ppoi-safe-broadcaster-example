// Mocks for send-bch command
const BCHJS = require('@psf/bch-js')

const getBalancesResult = {
  bchBalance: 2,
  sendTokens: () => {
    return {
      txid: '4aee846d3ef9bd70d36359c842dd6f4f278eaa794de4143456d23e862488a87e'
    }
  },
  bchjs: new BCHJS(),
  utxos: {
    utxoStore: {
      address: 'bitcoincash:qqetvdnlt0p8g27dr44cx7h057kpzly9xse9huc97z',
      bchUtxos: [
        {
          height: 700685,
          tx_hash:
            '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
          tx_pos: 0,
          value: 1000,
          txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
          vout: 0,
          isValid: false
        },
        {
          height: 700685,
          tx_hash:
            '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
          tx_pos: 2,
          value: 19406,
          txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
          vout: 2,
          isValid: false
        }
      ],
      nullUtxos: [],
      slpUtxos: {
        type1: {
          mintBatons: [],
          tokens: [
            {
              height: 700522,
              tx_hash:
                'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
              tx_pos: 1,
              value: 546,
              txid: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
              vout: 1,
              utxoType: 'token',
              transactionType: 'send',
              tokenId:
                'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
              tokenTicker: 'TROUT',
              tokenName: "Trout's test token",
              tokenDocumentUrl: 'troutsblog.com',
              tokenDocumentHash: '',
              decimals: 2,
              tokenType: 1,
              isValid: true,
              tokenQty: '4.25'
            }
          ]
        },
        nft: {
          groupMintBatons: [],
          groupTokens: [],
          tokens: []
        }
      }
    }
  }
}

module.exports = {
  getBalancesResult
}
