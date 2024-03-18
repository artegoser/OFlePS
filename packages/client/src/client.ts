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

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import type { AppRouter } from '@ofleps/server';

import { ec, HexString, SmartRequest } from '@ofleps/utils';
import { ITransferArgs } from './types/client.js';

export default class Client {
  // #region Properties (5)

  private _noPrivateKey = new Error('No private key, generate or set first');
  private _privateKey?: HexString;
  private _publicKey?: HexString;
  private _t;
  private _userNotExist = new Error('User not exist, register first');

  // #endregion Properties (5)

  // #region Constructors (1)

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

  // #endregion Constructors (1)

  // #region Public Getters And Setters (2)

  public get privateKey() {
    return this._privateKey;
  }

  public get publicKey() {
    return this._publicKey;
  }

  // #endregion Public Getters And Setters (2)

  // #region Public Methods (19)

  public buy(
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

  public cancelOrder(orderToCancelId: string) {
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

  public getGranularities() {
    return this._t.exchange.getGranularities.query();
  }

  public createAccount(
    name: string,
    description: string,
    currencySymbol: string
  ) {
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

  public async createSmartContract(
    name: string,
    description: string,
    code: string
  ) {
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

  public async executeSmartContract(id: string, request: SmartRequest) {
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

  public getAccountById(id: string) {
    return this._t.accounts.getById.query(id);
  }

  public getAccounts() {
    return this._t.accounts.getByUserPk.query(this._publicKey as HexString);
  }

  public getCurrencies(page: number = 1) {
    return this._t.currencies.get.query({ page });
  }

  public getCurrencyBySymbol(symbol: string) {
    return this._t.currencies.getBySymbol.query(symbol);
  }

  public getOrderBook(
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    page: number = 1
  ) {
    return this._t.exchange.getOrderBook.query({
      fromCurrencySymbol,
      toCurrencySymbol,
      page,
    });
  }

  public getSmartContractById(id: string) {
    return this._t.smartContracts.getById.query(id);
  }

  public getTradingSchedule(
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    granularity: string
  ) {
    return this._t.exchange.getTradingSchedule.query({
      fromCurrencySymbol,
      toCurrencySymbol,
      granularity,
    });
  }

  public getTransactions(accountId: string, page: number = 1) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign({ accountId, page }, this._privateKey);

    return this._t.transactions.get.query({ accountId, page, signature });
  }

  public getUserByPublicKey(publicKey: HexString) {
    return this._t.user.getByPublicKey.query(publicKey);
  }

  public async login(privateKey: HexString) {
    this.setPrivateKey(privateKey);

    const user = await this.getUserByPublicKey(this._publicKey as HexString);

    if (!user) {
      throw this._userNotExist;
    }

    return user;
  }

  public loginWithoutChecking(privateKey: HexString) {
    this.setPrivateKey(privateKey);
  }

  public async registerUser(name: string, email: string) {
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

  public sell(
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

  public setPrivateKey(privateKey: HexString) {
    const publicKey = ec.getPublicKey(privateKey);

    this._privateKey = privateKey;
    this._publicKey = publicKey;

    return this._publicKey;
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
  public transfer({ from, to, amount, comment }: ITransferArgs) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    const signature = ec.sign(
      { from, to, amount, comment, type: 'transfer' },
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

  // #endregion Public Methods (19)

  // #region Private Methods (1)

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

  // #endregion Private Methods (1)
}
