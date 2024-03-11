<h1 align="center">

![logo](./imgs/logo.png)

</h1>

# Open and flexible payment system (OFlePS)

> [!WARNING]  
> Current project is not production ready and work in progress. There are many things that need to be done before it's ready for production, and you should not use it in production environment until it's stable enough.
> Also, this project will be refactored or rewritten to rust before it will be ready for production.

## Description

Open and flexible payment system (OFlePS) is a federated payment system based on trpc api with JavaScript smart contracts.

## Features

- [x] Transactions: send and receive payments between accounts
- [x] Multiple accounts: users can have many accounts and make transactions
- [x] Multiple currencies: users can have different currencies in their accounts
- [x] trpc api: OFlePS uses [trpc](https://trpc.io/) to interaction between client and server
- [x] JavaScript smart contracts: OFlePS uses [isolated-vm](https://github.com/laverdet/isolated-vm) to run JavaScript smart contracts
- [x] OFlePS uses ed25519 cryptography for secure transactions and data exchange, each transaction is signed with user's private key
- [ ] Support for currency types: (fiat, crypto, stock, )
- [x] Stock exchange (really unstable)
- [ ] Federated inter-server transactions

## License

GPL-3.0 License
