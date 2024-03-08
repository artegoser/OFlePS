const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encode(str: string) {
  return encoder.encode(str);
}

export function decode(bytes: Uint8Array) {
  return decoder.decode(bytes);
}

export function stringify(obj: any) {
  return JSON.stringify(obj);
}

import { sha512 } from "@noble/hashes/sha512";
import * as ed from "@noble/ed25519";
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface IECMessage {
  [key: string]: any;
}

export type HexString = string & { __isHexString__: true };

export const ec = {
  h2b(hex: HexString): Uint8Array {
    return ed.etc.hexToBytes(hex);
  },
  b2h(bytes: Uint8Array): HexString {
    return ed.etc.bytesToHex(bytes) as HexString;
  },
  getRandomPrivateKey(): HexString {
    return ed.etc.bytesToHex(ed.utils.randomPrivateKey()) as HexString;
  },
  getPublicKey(privateKey: HexString): HexString {
    return ed.etc.bytesToHex(ed.getPublicKey(privateKey)) as HexString;
  },
  sign(message: IECMessage, privateKey: HexString): HexString {
    return ed.etc.bytesToHex(
      ed.sign(encode(stringify(message)), privateKey)
    ) as HexString;
  },
  signString(message: string, privateKey: HexString): HexString {
    return ed.etc.bytesToHex(ed.sign(encode(message), privateKey)) as HexString;
  },
  verify(
    signature: HexString,
    message: IECMessage,
    publicKey: HexString
  ): boolean {
    return ed.verify(signature, encode(stringify(message)), publicKey);
  },
};