import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import { ec, HexString } from "ofleps-utils";

export default class Client {
  private _t;
  private _privateKey?: HexString;
  private _publicKey?: HexString;
  private _userId?: string;
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

  generateKeyPair() {
    const privateKey = ec.getRandomPrivateKey();
    const publicKey = ec.getPublicKey(privateKey);

    this._privateKey = privateKey;
    this._publicKey = publicKey;

    return { privateKey, publicKey };
  }

  setPrivateKey(privateKey: HexString) {
    const publicKey = ec.getPublicKey(privateKey);

    this._privateKey = privateKey;
    this._publicKey = publicKey;

    return this._publicKey;
  }

  transactions(from: number, to: number) {
    return this._t.transactions.get.query({ from, to });
  }

  registerUser(name: string, email: string) {
    if (!this._privateKey || !this._publicKey) {
      throw new Error("No private key, generate or set first");
    }

    const sign = ec.sign(
      { name, email, publicKey: this._publicKey },
      this._privateKey
    );

    return this._t.user.register.mutate({
      name,
      email,
      publicKey: this._publicKey,
      signature: sign,
    });
  }
}
