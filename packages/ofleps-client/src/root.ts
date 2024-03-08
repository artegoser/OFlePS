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

  addCurrency(
    symbol: string,
    name: string,
    description: string,
    type?: string
  ) {
    const sign = ec.sign({ symbol, name, description, type }, this._privateKey);

    return this._t.root.addCurrency.mutate({
      symbol,
      name,
      description,
      type,
      signature: sign,
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

    const sign = ec.sign(
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
      signature: sign,
      salt,
    });
  }
}
