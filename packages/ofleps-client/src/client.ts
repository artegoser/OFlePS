// Copyright (c) 2024 artegoser (Artemy Egorov)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { ec, HexString, SmartRequest } from "ofleps-utils";
import { ITransferArgs } from "./types/client.js";

export default class Client {
  private _t;
  private _privateKey?: HexString;
  private _publicKey?: HexString;
  private _noPrivateKey = new Error("No private key, generate or set first");
  private _noUser = new Error("No user id, register or login first");
  private _userNotExist = new Error("User not exist, register first");
  constructor(baseUrl: string, privateKey?: HexString) {
    this._t = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
        }),
      ],
    });

    if (privateKey) {
      this.setPrivateKey(privateKey);
    }
  }

  get publicKey() {
    return this._publicKey;
  }

  get privateKey() {
    return this._privateKey;
  }

  setPrivateKey(privateKey: HexString) {
    const publicKey = ec.getPublicKey(privateKey);

    this._privateKey = privateKey;
    this._publicKey = publicKey;

    return this._publicKey;
  }

  getTransactions(accountId: string, page: number = 1) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign({ accountId, page }, this._privateKey);

    return this._t.transactions.get.query({ accountId, page, signature });
  }

  /**
   * A function that transfers an amount from one account to another.
   *
   * @param {ITransferArgs} from - the account to transfer from (id)
   * @param {ITransferArgs} to - the account to transfer to (id)
   * @param {ITransferArgs} amount - the amount to transfer
   * @param {ITransferArgs} [comment] - the comment associated with the transfer
   * @return {ReturnType} the result of the transfer operation
   */
  transfer({ from, to, amount, comment }: ITransferArgs) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign(
      { from, to, amount, comment, type: "transfer" },
      this._privateKey
    );

    return this._t.transactions.transfer.mutate({
      from,
      to,
      amount,
      comment,
      signature,
    });
  }

  buy(
    fromAccountId: string,
    toAccountId: string,
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    quantity: number,
    price: number
  ) {
    return this._createOrder(
      fromAccountId,
      toAccountId,
      fromCurrencySymbol,
      toCurrencySymbol,
      quantity,
      price,
      true
    );
  }

  sell(
    fromAccountId: string,
    toAccountId: string,
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    quantity: number,
    price: number
  ) {
    return this._createOrder(
      fromAccountId,
      toAccountId,
      fromCurrencySymbol,
      toCurrencySymbol,
      quantity,
      price,
      false
    );
  }

  private _createOrder(
    fromAccountId: string,
    toAccountId: string,
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    quantity: number,
    price: number,
    type: boolean
  ) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign(
      {
        fromAccountId,
        toAccountId,
        fromCurrencySymbol,
        toCurrencySymbol,
        quantity,
        price,
        type,
      },
      this._privateKey
    );

    if (type)
      return this._t.exchange.buy.mutate({
        fromAccountId,
        toAccountId,
        fromCurrencySymbol,
        toCurrencySymbol,
        quantity,
        price,
        signature,
      });

    return this._t.exchange.sell.mutate({
      fromAccountId,
      toAccountId,
      fromCurrencySymbol,
      toCurrencySymbol,
      quantity,
      price,
      signature,
    });
  }

  cancelOrder(orderToCancelId: string) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign(
      {
        orderToCancelId,
      },
      this._privateKey
    );

    return this._t.exchange.cancel.mutate({
      orderToCancelId,
      signature,
    });
  }

  getCurrencies(page: number = 1) {
    return this._t.currencies.get.query({ page });
  }

  getCurrencyBySymbol(symbol: string) {
    return this._t.currencies.getBySymbol.query(symbol);
  }

  async registerUser(name: string, email: string) {
    if (!this._privateKey || !this._publicKey) {
      const { privateKey, publicKey } = ec.generateKeyPair();

      this._privateKey = privateKey;
      this._publicKey = publicKey;
    }

    const signature = ec.sign(
      { name, email, publicKey: this._publicKey },
      this._privateKey
    );

    return await this._t.user.register.mutate({
      name,
      email,
      publicKey: this._publicKey,
      signature,
    });
  }

  async login(privateKey: HexString) {
    this.setPrivateKey(privateKey);

    const user = await this.getUserByPublicKey(this._publicKey as HexString);

    if (!user) {
      throw this._userNotExist;
    }

    return user;
  }

  getUserByPublicKey(publicKey: HexString) {
    return this._t.user.getByPublicKey.query(publicKey);
  }

  createAccount(name: string, description: string, currencySymbol: string) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const sign = ec.sign(
      { name, description, currencySymbol, userPk: this._publicKey },
      this._privateKey
    );

    return this._t.accounts.create.mutate({
      name,
      description,
      currencySymbol,
      userPk: this._publicKey,
      signature: sign,
    });
  }

  getAccountById(id: string) {
    return this._t.accounts.getById.query(id);
  }

  async createSmartContract(name: string, description: string, code: string) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const sign = ec.sign(
      { name, description, code, authorPk: this._publicKey },
      this._privateKey
    );

    return this._t.smartContracts.create.mutate({
      name,
      description,
      code,
      authorPk: this._publicKey,
      signature: sign,
    });
  }

  async executeSmartContract(id: string, request: SmartRequest) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign(
      { smartContractId: id, reqData: request, callerPk: this._publicKey },
      this._privateKey
    );

    return this._t.smartContracts.execute.mutate({
      id,
      request,
      callerPk: this._publicKey,
      signature,
    });
  }
}
