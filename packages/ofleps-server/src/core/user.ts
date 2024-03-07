import { db } from "../config/app.service.js";
import { HexString, decode, encode, stringify } from "ofleps-utils";
import { BadRequestError } from "../errors/main.js";
import { ec } from "ofleps-utils";

export async function registerUser(
  name: string,
  email: string,
  publicKey: HexString,
  signature: HexString
) {
  if (!ec.verify(signature, { name, email, publicKey }, publicKey)) {
    throw new BadRequestError("Invalid signature");
  }

  return await db.user.create({ data: { name, email, publicKey } });
}
