import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import * as ed from "@noble/ed25519";
import { stringify, encode } from "ofleps-utils";

import { sha512 } from "@noble/hashes/sha512";
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export default class Client {
  private _t;
  private _privateKey?: string;
  private _publicKey?: string;
  constructor(baseUrl: string, privateKey?: string) {
    this._t = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: baseUrl,
        }),
      ],
    });

    if (privateKey) {
      this._setPrivateKey(privateKey);
    }
  }

  get publicKey() {
    return this._publicKey;
  }

  get privateKey() {
    return this._privateKey;
  }

  generateKeyPair() {
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = ed.getPublicKey(privateKey);

    this._privateKey = ed.etc.bytesToHex(privateKey);
    this._publicKey = ed.etc.bytesToHex(publicKey);

    return { privateKey: this._privateKey, publicKey: this._publicKey };
  }

  private _setPrivateKey(privateKey: string) {
    const publicKey = ed.getPublicKey(ed.etc.hexToBytes(privateKey));
    this._privateKey = privateKey;
    this._publicKey = ed.etc.bytesToHex(publicKey);

    return this._publicKey;
  }

  transactions(from: number, to: number) {
    return this._t.transactions.query({ from, to });
  }

  createUser(name: string, email: string) {
    if (!this._privateKey || !this._publicKey) {
      throw new Error("No private key");
    }

    const message = encode(
      stringify({ name, email, publicKey: this._publicKey })
    );

    const sign = ed.sign(message, ed.etc.hexToBytes(this._privateKey));

    return this._t.user.mutate({
      name,
      email,
      publicKey: this._publicKey,
      signature: ed.etc.bytesToHex(sign),
    });
  }
}
