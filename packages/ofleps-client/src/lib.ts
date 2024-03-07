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
