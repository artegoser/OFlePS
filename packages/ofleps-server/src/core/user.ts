import { db } from "../config/app.service.js";
import * as ed from "@noble/ed25519";
import { decode, encode, stringify } from "ofleps-utils";
import { BadRequestError } from "../errors/main.js";

export async function registerUser(
  name: string,
  email: string,
  publicKey: string,
  signature: string
) {
  const pKey = ed.etc.hexToBytes(publicKey);
  const sign = ed.etc.hexToBytes(signature);
  const message = encode(stringify({ name, email, publicKey }));

  if (!(await ed.verifyAsync(sign, message, pKey))) {
    throw new BadRequestError("Invalid signature");
  }

  return await db.user.create({ data: { name, email, publicKey } });
}
