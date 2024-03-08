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

import { HexString, ec } from "ofleps-utils";
import { db, config } from "../config/app.service.js";
import { ForbiddenError } from "../errors/main.js";

export function addCurrency({
  symbol,
  name,
  description,
  type,
  signature,
}: {
  symbol: string;
  name: string;
  description: string;
  type?: string;
  signature: HexString;
}) {
  if (
    !ec.verify(
      signature,
      { symbol, name, description, type },
      config.root_public_key
    )
  ) {
    throw new ForbiddenError("Invalid signature for root");
  }

  return db.currency.create({
    data: {
      symbol,
      name,
      description,
      type,
    },
  });
}

export async function issue({
  to,
  amount,
  comment,
  signature,
}: {
  to: string;
  amount: number;
  comment?: string;
  signature: HexString;
}) {
  if (
    !ec.verify(
      signature,
      { from: "root", to, amount, comment, type: "issue" },
      config.root_public_key
    )
  ) {
    throw new ForbiddenError("Invalid signature for root");
  }

  return db.$transaction([
    db.account.update({
      where: {
        id: to,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    }),

    db.transaction.create({
      data: {
        from: to,
        to,
        amount,
        comment: `Issued by root${comment ? `: ${comment}` : ""}`,
        type: "issue",
        signature,
      },
    }),
  ]);
}
