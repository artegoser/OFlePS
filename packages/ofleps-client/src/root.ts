import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { ec, genSalt, HexString } from "ofleps-utils";

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

  setBlockUser(userId: string, block: boolean) {
    const signature = ec.sign({ userId, block }, this._privateKey);

    return this._t.root.setBlockUser.mutate({
      userId,
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

  setApproveUser(userId: string, approve: boolean) {
    const signature = ec.sign({ userId, approve }, this._privateKey);

    return this._t.root.setApproveUser.mutate({
      userId,
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
    const salt = genSalt();
    const commentTx = `Issued by root${comment ? `: ${comment}` : ""}`;

    const signature = ec.sign(
      {
        from: "root",
        to,
        amount,
        comment: commentTx,
        salt,
        type: "issue",
      },
      this._privateKey
    );

    return this._t.root.issue.mutate({
      to,
      amount,
      comment: commentTx,
      signature,
      salt,
    });
  }
}
