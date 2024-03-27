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

import {
  createTRPCProxyClient,
  createWSClient,
  wsLink,
  splitLink,
  httpBatchLink,
} from '@trpc/client';

import type { AppRouter, ExchangeCommentData } from '@ofleps/server';

import { SmartRequest } from '@ofleps/utils';
import { ITransferArgs } from './types/client.js';

import { WebSocket } from 'ws';

export default class Client {
  // #region Properties (3)

  private _jwt?: string;
  private _t;
  private _wst;

  // #endregion Properties (3)

  // #region Constructors (1)

  constructor(baseUrl: string, wss: boolean = false) {
    const headers = (() => {
      return {
        Authorization: `Bearer ${this._jwt}`,
      };
    }).bind(this);

    if (wss) {
      globalThis.WebSocket = WebSocket as any;
      const url = new URL(baseUrl);
      this._wst = createWSClient({
        url: `ws://${url.host}`,
      });

      this._t = createTRPCProxyClient<AppRouter>({
        links: [
          splitLink({
            condition(op) {
              return op.type === 'subscription';
            },
            true: wsLink({
              client: this._wst,
            }),
            false: httpBatchLink({
              headers,
              url: baseUrl,
            }),
          }),
        ],
      });
    } else {
      this._t = createTRPCProxyClient<AppRouter>({
        links: [
          httpBatchLink({
            headers,
            url: baseUrl,
          }),
        ],
      });
    }
  }

  // #endregion Constructors (1)

  // #region Public Getters And Setters (3)

  public get jwt() {
    return this._jwt;
  }

  public get orderBookSubscribe(): typeof this._t.exchange.orderBookSubscription.subscribe {
    return this._t.exchange.orderBookSubscription.subscribe;
  }

  public get transactionsSubscribe(): typeof this._t.transactions.subscription.subscribe {
    return this._t.transactions.subscription.subscribe;
  }

  // #endregion Public Getters And Setters (3)

  // #region Public Methods (29)

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
    return this._t.exchange.cancel.mutate({
      orderToCancelId,
    });
  }

  public createAccount(
    alias: string,
    name: string,
    description: string,
    currencySymbol: string
  ) {
    return this._t.accounts.create.mutate({
      alias,
      name,
      description,
      currencySymbol,
    });
  }

  public async createSmartContract(
    name: string,
    description: string,
    code: string
  ) {
    return this._t.smartContracts.create.mutate({
      name,
      description,
      code,
    });
  }

  public async executeSmartContract(id: string, request: SmartRequest) {
    return this._t.smartContracts.execute.mutate({
      id,
      request,
    });
  }

  public getAccountById(id: string) {
    return this._t.accounts.getById.query(id);
  }

  public getAccounts() {
    return this._t.accounts.get.query();
  }

  public getCurrencies(page: number = 1) {
    return this._t.currencies.get.query({ page });
  }

  public getCurrencyBySymbol(symbol: string) {
    return this._t.currencies.getBySymbol.query(symbol);
  }

  public getGranularities() {
    return this._t.exchange.getGranularities.query();
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

  public getOrders() {
    return this._t.exchange.getOrders.query();
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

  public getTransactions(page: number = 1) {
    return this._t.transactions.get.query(page);
  }

  public getTransactionsByAccountId(accountId: string, page: number = 1) {
    return this._t.transactions.getByAccountId.query({ accountId, page });
  }

  public async getTransactionsGrouped(accountId: string, page: number = 1) {
    const non_grouped_transactions = await this.getTransactionsByAccountId(
      accountId,
      page
    );

    const transactions: typeof non_grouped_transactions = [];
    const exchange: {
      transaction: (typeof non_grouped_transactions)[0];
      data: ExchangeCommentData;
    }[] = [];

    for (const transaction of non_grouped_transactions) {
      if (transaction?.comment?.startsWith('@exchange')) {
        const data = JSON.parse(transaction.comment.slice(9));

        transaction.comment = null;

        exchange.push({
          transaction,
          data,
        });
      } else {
        transactions.push(transaction);
      }
    }

    return { transactions, exchange };
  }

  public getUser() {
    return this._t.user.get.query();
  }

  public getUserByAlias(alias: string) {
    return this._t.user.getByAlias.query(alias);
  }

  public async registerUser(
    alias: string,
    password: string,
    name: string,
    email: string
  ) {
    const res = await this._t.user.register.mutate({
      alias,
      password,
      name,
      email,
    });

    this._jwt = res.jwt;

    return res;
  }

  public rootAddCurrency(
    symbol: string,
    name: string,
    description: string,
    type?: string
  ) {
    return this._t.root.addCurrency.mutate({
      symbol,
      name,
      description,
      type,
    });
  }

  public rootApproveUser(userAlias: string, approve: boolean = true) {
    return this._t.root.setApproveUser.mutate({
      alias: userAlias,
      approve,
    });
  }

  public rootBlockAccount(accountId: string, block: boolean = true) {
    return this._t.root.setBlockAccount.mutate({
      accountId,
      block,
    });
  }

  public rootBlockUser(userAlias: string, block: boolean = true) {
    return this._t.root.setBlockUser.mutate({
      alias: userAlias,
      block,
    });
  }

  public rootIssueToAccountId(
    accountId: string,
    amount: number,
    comment?: string
  ) {
    return this._t.root.issue.mutate({
      to: accountId,
      amount,
      comment: comment || '',
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

  public async setCredentials(jwt: string) {
    this._jwt = jwt;
  }

  public async signin(alias: string, password: string) {
    const res = await this._t.user.signin.query({ alias, password });

    this._jwt = res.jwt;

    return res;
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
    return this._t.transactions.transfer.mutate({
      from,
      to,
      amount,
      comment,
    });
  }

  // #endregion Public Methods (29)

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
    if (type)
      return this._t.exchange.buy.mutate({
        fromAccountId,
        toAccountId,
        fromCurrencySymbol,
        toCurrencySymbol,
        quantity,
        price,
      });

    return this._t.exchange.sell.mutate({
      fromAccountId,
      toAccountId,
      fromCurrencySymbol,
      toCurrencySymbol,
      quantity,
      price,
    });
  }

  // #endregion Private Methods (1)
}
