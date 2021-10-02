/*
  Contains mock data for the util.js library.
*/

'use strict'

const mockSpentUtxo = [
  {
    txid: '2cb218dc02e5df66506950174bfa540497973cba141f1ff737d3be042069c935',
    vout: 0,
    value: '1000',
    height: 1332533,
    confirmations: 32,
    satoshis: 1000,
    hdIndex: 1
  }
]

const mockUnspentUtxo = [
  {
    txid: '62a3ea958a463a372bc0caf2c374a7f60be9c624be63a0db8db78f05809df6d8',
    vout: 0,
    amount: 0.00006,
    satoshis: 6000,
    height: 603562,
    confirmations: 10
  }
]

const mockWallet = {
  mnemonic:
    'wool coil panel mammal victory view enjoy dream dynamic cycle pig help',
  derivation: 245,
  rootAddress: 'bitcoincash:qrqug96lmh6mvd43gzld0vgz6mkk3vktgvpfzdrqkm',
  balance: 0.00009636,
  nextAddress: 3,
  hasBalance: [
    {
      index: 1,
      balance: 0,
      balanceSat: 0,
      unconfirmedBalance: 0.0000909,
      unconfirmedBalanceSat: 9090,
      cashAddress: 'bitcoincash:qquwktj59rv6feg7kmaa9ynkpgeqhcledynsa6ycxh'
    },
    {
      index: 2,
      balance: 0,
      balanceSat: 0,
      unconfirmedBalance: 0.00000546,
      unconfirmedBalanceSat: 546,
      cashAddress: 'bitcoincash:qr7ku4y5hy92sfsq9le0ula3rx5n33l8u5qz8mmy55'
    }
  ],
  addresses: [
    [0, 'bitcoincash:qrqug96lmh6mvd43gzld0vgz6mkk3vktgvpfzdrqkm'],
    [1, 'bitcoincash:qquwktj59rv6feg7kmaa9ynkpgeqhcledynsa6ycxh'],
    [2, 'bitcoincash:qr7ku4y5hy92sfsq9le0ula3rx5n33l8u5qz8mmy55']
  ],
  description: '',
  name: 'temp',
  balanceConfirmed: 0,
  balanceUnconfirmed: 0.00009636,
  SLPUtxos: [
    {
      address: 'bitcoincash:qr7ku4y5hy92sfsq9le0ula3rx5n33l8u5qz8mmy55',
      utxos: [
        {
          height: 0,
          tx_hash:
            '7a402444111750e744b1f4f9fdcf2050385312d8422c6683d20f752565384dee',
          tx_pos: 1,
          value: 546,
          txid: '7a402444111750e744b1f4f9fdcf2050385312d8422c6683d20f752565384dee',
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
          tokenQty: '1.2',
          address: 'bitcoincash:qr7ku4y5hy92sfsq9le0ula3rx5n33l8u5qz8mmy55',
          hdIndex: 2
        }
      ]
    }
  ],
  BCHUtxos: [
    {
      address: 'bitcoincash:qquwktj59rv6feg7kmaa9ynkpgeqhcledynsa6ycxh',
      utxos: [
        {
          height: 0,
          tx_hash:
            '17b1ef0a9995e621fd5dfc4e44adc0a07b62d2d0952ced92ccbcb1043a14cf13',
          tx_pos: 0,
          value: 9090,
          txid: '17b1ef0a9995e621fd5dfc4e44adc0a07b62d2d0952ced92ccbcb1043a14cf13',
          vout: 0,
          isValid: false,
          address: 'bitcoincash:qquwktj59rv6feg7kmaa9ynkpgeqhcledynsa6ycxh',
          hdIndex: 1
        }
      ]
    }
  ]
}

const mockTxOut = {
  bestblock: '000000000000000001e36f898d6dcd941b1de4202466d72843209277cc052bbc',
  confirmations: 11,
  value: 0.00006,
  scriptPubKey: {
    asm: 'OP_DUP OP_HASH160 d19fae66b685f5c3633c0db0600313918347225f OP_EQUALVERIFY OP_CHECKSIG',
    hex: '76a914d19fae66b685f5c3633c0db0600313918347225f88ac',
    reqSigs: 1,
    type: 'pubkeyhash',
    addresses: ['bitcoincash:qrgeltnxk6zltsmr8sxmqcqrzwgcx3eztusrwgf0x3']
  },
  coinbase: false
}

module.exports = {
  mockSpentUtxo,
  mockUnspentUtxo,
  mockWallet,
  mockTxOut
}
