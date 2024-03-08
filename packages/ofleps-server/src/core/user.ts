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

import { db, config } from "../config/app.service.js";
import { ForbiddenError } from "../errors/main.js";
import { ec } from "ofleps-utils";

import type { HexString } from "ofleps-utils";
import { checkFromTo } from "./utils.js";

export async function registerUser(
  name: string,
  email: string,
  publicKey: HexString,
  signature: HexString
) {
  if (!ec.verify(signature, { name, email, publicKey }, publicKey)) {
    throw new ForbiddenError("Invalid signature");
  }

  return await db.user.create({
    data: { name, email, publicKey, approved: config.auto_approve },
  });
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

export async function getUsers(from: number, to: number) {
  checkFromTo(from, to);

  return await db.user.findMany({ skip: from, take: to - from });
}
