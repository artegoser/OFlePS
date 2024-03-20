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

import type { AppRouter } from '@ofleps/server';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import { ec, HexString } from '@ofleps/utils';

export default class Root {
  private _t;
  private _privateKey: HexString;
  private _publicKey: HexString;
  constructor(baseUrl: string, privateKey: HexString) {
    this._t = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
        }),
      ],
    });

    this._privateKey = privateKey;
    this._publicKey = ec.getPublicKey(privateKey);
  }

  get privateKey() {
    return this._privateKey;
  }

  get publicKey() {
    return this._publicKey;
  }

  setBlockUser(alias: string, block: boolean) {
    const signature = ec.sign({ alias, block }, this._privateKey);

    return this._t.root.setBlockUser.mutate({
      alias,
      block,
      signature,
    });
  }

  setBlockAccount(accountId: string, block: boolean) {
    const signature = ec.sign({ accountId, block }, this._privateKey);

    return this._t.root.setBlockAccount.mutate({
      accountId,
      block,
      signature,
    });
  }

  setApproveUser(alias: string, approve: boolean) {
    const signature = ec.sign({ alias, approve }, this._privateKey);

    return this._t.root.setApproveUser.mutate({
      alias,
      approve,
      signature,
    });
  }

  /**
   * A function to add a new currency.
   *
   * @param {string} symbol - the symbol of the currency
   * @param {string} name - the name of the currency
   * @param {string} description - the description of the currency
   * @param {string} [type] - the type of the currency (optional)
   * @return {ReturnType} the result of adding the currency
   */
  addCurrency(
    symbol: string,
    name: string,
    description: string,
    type?: string
  ) {
    const signature = ec.sign(
      { symbol, name, description, type },
      this._privateKey
    );

    return this._t.root.addCurrency.mutate({
      symbol,
      name,
      description,
      type,
      signature,
    });
  }

  /**
   * Issues a certain amount to a specified recipient account, with an optional comment.
   *
   * @param {string} to - the recipient of the issued amount (id of account)
   * @param {number} amount - the amount to be issued
   * @param {string} [comment] - an optional comment
   * @return {ReturnType} the result of the issue operation
   */
  issue(to: string, amount: number, comment?: string) {
    const commentTx = `Issued by root${comment ? `: ${comment}` : ''}`;
    const timestamp = Date.now();

    const signature = ec.sign(
      {
        from: 'root',
        to,
        amount,
        comment: commentTx,
        timestamp,
        type: 'issue',
      },
      this._privateKey
    );

    return this._t.root.issue.mutate({
      to,
      amount,
      comment: commentTx,
      signature,
      timestamp,
    });
  }
}
