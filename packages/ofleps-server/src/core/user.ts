import { db } from "../config/app.service.js";
import { BadRequestError } from "../errors/main.js";
import { ec } from "ofleps-utils";

import type { HexString } from "ofleps-utils";

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

export async function getUserById(id: string) {
  return await db.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
  return await db.user.findUnique({ where: { email } });
}

export async function getUserByPublicKey(publicKey: HexString) {
  return await db.user.findUnique({ where: { publicKey } });
}
