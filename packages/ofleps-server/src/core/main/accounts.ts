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

import { db } from "../../config/app.service.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../errors/main.js";
import { ec } from "ofleps-utils";
import { getUserById } from "./user.js";
import { getCurrencyBySymbol } from "./currencies.js";

import type { HexString } from "ofleps-utils";

export async function createAccount({
  name,
  description,
  currencySymbol,
  userId,
  signature,
}: {
  name: string;
  description: string;
  currencySymbol: string;
  userId: string;
  signature: HexString;
}) {
  const user = await getUserById(userId);
  const currency = await getCurrencyBySymbol(currencySymbol);

  if (!user) {
    throw new NotFoundError(`User with id "${userId}"`);
  }

  if (!currency) {
    throw new NotFoundError(`Currency with symbol "${currencySymbol}"`);
  }

  if (user.blocked) {
    throw new ForbiddenError(
      `User with id "${userId}" is blocked and cannot create an account`
    );
  }

  if (
    !ec.verify(
      signature,
      { name, description, currencySymbol, userId },
      user.publicKey as HexString
    )
  ) {
    throw new ForbiddenError("Invalid signature");
  }

  return await db.account.create({
    data: {
      name,
      description,
      currencySymbol,
      balance: 0,
      userId,
    },
  });
}

export async function getAccountById(id: string) {
  return await db.account.findUnique({ where: { id } });
}
