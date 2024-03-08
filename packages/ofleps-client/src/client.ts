import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { ec, HexString } from "ofleps-utils";
import { ITransferArgs } from "./types/client.js";

export default class Client {
  private _t;
  private _privateKey?: HexString;
  private _publicKey?: HexString;
  private _userId?: string;
  private _noPrivateKey = new Error("No private key, generate or set first");
  private _noUser = new Error("No user id, register or login first");
  private _userNotExist = new Error("User not exist, login or register first");
  private _invalidPrivateKey = new Error(
    "Invalid private key provided for user"
  );
  constructor(baseUrl: string, privateKey?: HexString, userId?: string) {
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

    if (userId) {
      this._userId = userId;
    }
  }

  get publicKey() {
    return this._publicKey;
  }

  get privateKey() {
    return this._privateKey;
  }

  get userId() {
    return this._userId;
  }

  setPrivateKey(privateKey: HexString) {
    const publicKey = ec.getPublicKey(privateKey);

    this._privateKey = privateKey;
    this._publicKey = publicKey;

    return this._publicKey;
  }

  getTransactions(from: number, to: number) {
    return this._t.transactions.get.query({ from, to });
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

    const sign = ec.sign(
      { from, to, amount, comment, type: "transfer" },
      this._privateKey
    );

    return this._t.transactions.transfer.mutate({
      from,
      to,
      amount,
      comment,
      signature: sign,
    });
  }

  getCurrencies(from: number, to: number) {
    return this._t.currencies.get.query({ from, to });
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

    const sign = ec.sign(
      { name, email, publicKey: this._publicKey },
      this._privateKey
    );

    const resp = await this._t.user.register.mutate({
      name,
      email,
      publicKey: this._publicKey,
      signature: sign,
    });

    this._userId = resp.id;

    return resp;
  }

  async login(id: string, privateKey: HexString) {
    this.setPrivateKey(privateKey);

    const user = await this.getUserById(id);

    if (!user) {
      throw this._userNotExist;
    }

    if (user.publicKey !== this._publicKey) {
      throw this._invalidPrivateKey;
    }
  }

  getUsers(from: number, to: number) {
    return this._t.user.get.query({ from, to });
  }

  getUserById(id: string) {
    return this._t.user.getById.query(id);
  }

  getUserByEmail(email: string) {
    return this._t.user.getByEmail.query(email);
  }

  getUserByPublicKey(publicKey: HexString) {
    return this._t.user.getByPublicKey.query(publicKey);
  }

  createAccount(name: string, description: string, currencySymbol: string) {
    if (!this._privateKey || !this._publicKey) {
      throw this._noPrivateKey;
    }

    if (!this._userId) {
      throw this._noUser;
    }

    const sign = ec.sign(
      { name, description, currencySymbol, userId: this._userId },
      this._privateKey
    );

    return this._t.accounts.create.mutate({
      name,
      description,
      currencySymbol,
      userId: this._userId,
      signature: sign,
    });
  }

  getAccountById(id: string) {
    return this._t.accounts.getById.query(id);
  }
}
