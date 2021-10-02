# psf-bch-wallet

This is a command-line (CLI) app for working with the Bitcoin Cash (BCH) blockchain, and SLP tokens.

This app connects to a [ipfs-bch-wallet-service](https://github.com/Permissionless-Software-Foundation/ipfs-bch-wallet-service) over [IPFS](https://ipfs.io), using the [ipfs-coord](https://github.com/Permissionless-Software-Foundation/ipfs-coord) library. This app uses the [oclif CLI framework](https://oclif.io/).

- [(Video) How to Install and Use](https://youtu.be/45YEeZi_8Kc)

## Install

- `git clone` this repository.
- `npm install` dependencies.
- `./bin/run help` to see a list of available commands.
- `./bin/run daemon` to create an IPFS node and connect to the network. Leave daemon running in order to execute blockchain-based commands.
- `./bin/run wallet-create` to create a wallet. Wallet files are stored in the `.wallets` directory.

## License

[MIT](./LICENSE.md)

## Credit

- [js-ipfs](https://www.npmjs.com/package/ipfs) - The IPFS node software.
- [ipfs-coord](https://github.com/Permissionless-Software-Foundation/ipfs-coord) - IPFS subnet coordination library.
- [bch-js](https://github.com/Permissionless-Software-Foundation/bch-js) - BCH toolkit.
- [oclif](https://oclif.io/) - CLI framework.
- [pkg](https://github.com/vercel/pkg) - binary compiler.
- [conf-cli](https://github.com/natzcam/conf-cli) - oclif config plugin.

## Table of Contents

<!-- toc -->
* [psf-bch-wallet](#psf-bch-wallet)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g railgun
$ railgun COMMAND
running command...
$ railgun (-v|--version|version)
railgun/v1.0.0 linux-x64 node-v14.17.6
$ railgun --help [COMMAND]
USAGE
  $ railgun COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`railgun conf [KEY] [VALUE]`](#railgun-conf-key-value)
* [`railgun daemon`](#railgun-daemon)
* [`railgun help [COMMAND]`](#railgun-help-command)
* [`railgun ipfs-peers`](#railgun-ipfs-peers)
* [`railgun ipfs-relays`](#railgun-ipfs-relays)
* [`railgun p2wdb-read`](#railgun-p2wdb-read)
* [`railgun p2wdb-service`](#railgun-p2wdb-service)
* [`railgun p2wdb-write`](#railgun-p2wdb-write)
* [`railgun send-bch`](#railgun-send-bch)
* [`railgun send-tokens`](#railgun-send-tokens)
* [`railgun token-burn`](#railgun-token-burn)
* [`railgun wallet-addrs`](#railgun-wallet-addrs)
* [`railgun wallet-balances`](#railgun-wallet-balances)
* [`railgun wallet-create`](#railgun-wallet-create)
* [`railgun wallet-list`](#railgun-wallet-list)
* [`railgun wallet-remove`](#railgun-wallet-remove)
* [`railgun wallet-service`](#railgun-wallet-service)

## `railgun conf [KEY] [VALUE]`

manage configuration

```
USAGE
  $ railgun conf [KEY] [VALUE]

ARGUMENTS
  KEY    key of the config
  VALUE  value of the config

OPTIONS
  -d, --cwd=cwd          config file location
  -d, --delete           delete?
  -h, --help             show CLI help
  -k, --key=key          key of the config
  -n, --name=name        config file name
  -p, --project=project  project name
  -v, --value=value      value of the config
```

_See code: [conf-cli](https://github.com/natzcam/conf-cli/blob/v0.1.9/src/commands/conf.ts)_

## `railgun daemon`

Start a daemon connection to the wallet service.

```
USAGE
  $ railgun daemon

DESCRIPTION
  This command will start a 'daemon' service, which is a IPFS node that will
  connect to a BCH wallet service over IPFS. It will also start a REST API
  server, which is how the other commands in this app will communicate with
  the BCH wallet service.
```

_See code: [src/commands/daemon.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/daemon.js)_

## `railgun help [COMMAND]`

display help for railgun

```
USAGE
  $ railgun help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `railgun ipfs-peers`

Query the state of subnet peers

```
USAGE
  $ railgun ipfs-peers

OPTIONS
  -a, --all  Display all data about peers
```

_See code: [src/commands/ipfs-peers.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/ipfs-peers.js)_

## `railgun ipfs-relays`

Query the state of circuit relays

```
USAGE
  $ railgun ipfs-relays
```

_See code: [src/commands/ipfs-relays.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/ipfs-relays.js)_

## `railgun p2wdb-read`

Burn a specific quantity of SLP tokens.

```
USAGE
  $ railgun p2wdb-read

OPTIONS
  -c, --centralized  Use centralized mode to connect to P2WDB.
  -h, --hash=hash    Hash representing P2WDB entry
```

_See code: [src/commands/p2wdb-read.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/p2wdb-read.js)_

## `railgun p2wdb-service`

List and/or select a P2WDB service provider.

```
USAGE
  $ railgun p2wdb-service

OPTIONS
  -s, --select=select  Switch to a given IPFS ID for P2WDB service.
```

_See code: [src/commands/p2wdb-service.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/p2wdb-service.js)_

## `railgun p2wdb-write`

Burn a specific quantity of SLP tokens.

```
USAGE
  $ railgun p2wdb-write

OPTIONS
  -a, --appId=appId  appId string to categorize data
  -c, --centralized  Use centralized mode to connect to P2WDB.
  -d, --data=data    String of data to write to the P2WDB
  -n, --name=name    Name of wallet
```

_See code: [src/commands/p2wdb-write.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/p2wdb-write.js)_

## `railgun send-bch`

Send BCH

```
USAGE
  $ railgun send-bch

OPTIONS
  -a, --sendAddr=sendAddr  Cash address to send to
  -n, --name=name          Name of wallet
  -q, --qty=qty            Quantity in BCH
```

_See code: [src/commands/send-bch.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/send-bch.js)_

## `railgun send-tokens`

Send Tokens

```
USAGE
  $ railgun send-tokens

OPTIONS
  -a, --sendAddr=sendAddr  Cash or SimpleLedger address to send to
  -n, --name=name          Name of wallet
  -q, --qty=qty
  -t, --tokenId=tokenId    Token ID
```

_See code: [src/commands/send-tokens.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/send-tokens.js)_

## `railgun token-burn`

Burn a specific quantity of SLP tokens.

```
USAGE
  $ railgun token-burn

OPTIONS
  -n, --name=name        Name of wallet
  -q, --qty=qty          Quantity of tokens to burn
  -t, --tokenId=tokenId  tokenId of token to burn
```

_See code: [src/commands/token-burn.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/token-burn.js)_

## `railgun wallet-addrs`

List the different addresses for a wallet.

```
USAGE
  $ railgun wallet-addrs

OPTIONS
  -n, --name=name  Name of wallet
```

_See code: [src/commands/wallet-addrs.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-addrs.js)_

## `railgun wallet-balances`

Display the balances of the wallet

```
USAGE
  $ railgun wallet-balances

OPTIONS
  -n, --name=name  Name of wallet
  -v, --verbose    Show verbose UTXO information
```

_See code: [src/commands/wallet-balances.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-balances.js)_

## `railgun wallet-create`

Generate a new HD Wallet.

```
USAGE
  $ railgun wallet-create

OPTIONS
  -d, --description=description  Description of the wallet
  -n, --name=name                Name of wallet
```

_See code: [src/commands/wallet-create.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-create.js)_

## `railgun wallet-list`

List existing wallets.

```
USAGE
  $ railgun wallet-list
```

_See code: [src/commands/wallet-list.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-list.js)_

## `railgun wallet-remove`

Remove an existing wallet.

```
USAGE
  $ railgun wallet-remove

OPTIONS
  -n, --name=name  Name of wallet
```

_See code: [src/commands/wallet-remove.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-remove.js)_

## `railgun wallet-service`

List and/or select a wallet service provider.

```
USAGE
  $ railgun wallet-service

OPTIONS
  -s, --select=select  Switch to a given IPFS ID for wallet service.
```

_See code: [src/commands/wallet-service.js](https://github.com/Railgun-Community/lepton/blob/vv1.0.0/src/commands/wallet-service.js)_
<!-- commandsstop -->
