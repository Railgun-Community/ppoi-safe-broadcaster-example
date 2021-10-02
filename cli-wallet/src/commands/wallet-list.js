/*
  List out all the wallet .json files.
*/

'use strict'

const shelljs = require('shelljs')
const Table = require('cli-table')

const { Command } = require('@oclif/command')

class WalletList extends Command {
  constructor (argv, config) {
    super(argv, config)

    // Encapsulate dependencies.
    this.shelljs = shelljs
  }

  async run () {
    try {
      const walletData = this.parseWallets()
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      return this.displayTable(walletData)
    } catch (err) {
      console.log(err)
      throw err
    }
  }

  // Parse data from the wallets directory into a formatted array.
  parseWallets () {
    const fileList = this.shelljs.ls(
      `${__dirname.toString()}/../../.wallets/*.json`
    )
    // console.log('fileList: ', fileList)

    if (fileList.length === 0) {
      console.log('No wallets found.')
      return []
    }

    const retData = []

    // Loop through each wallet returned.
    for (let i = 0; i < fileList.length; i++) {
      const thisFile = fileList[i]
      // console.log(`thisFile: ${thisFile}`)

      const lastPart = thisFile.indexOf('.json')

      const lastSlash = thisFile.indexOf('.wallets/') + 1
      // console.log(`lastSlash: ${lastSlash}`)

      let name = thisFile.slice(8, lastPart)
      // console.log(`name: ${name}`)

      name = name.slice(lastSlash)

      // Delete the cached copy of the wallet. This allows testing of list-wallets.
      delete require.cache[require.resolve(`${thisFile}`)]

      const walletInfo = require(`${thisFile}`)

      retData.push([name, walletInfo.wallet.description])
    }

    return retData
  }

  // Display table in a table on the command line using cli-table.
  displayTable (data) {
    const table = new Table({
      head: ['Name', 'Description'],
      colWidths: [25, 15]
    })

    for (let i = 0; i < data.length; i++) table.push(data[i])

    const tableStr = table.toString()

    // Cut down on screen spam when running unit tests.
    console.log(tableStr)

    return tableStr
  }
}

WalletList.description = 'List existing wallets.'

WalletList.flags = {}

module.exports = WalletList
