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
import { db } from "../config/app.service.js";
import { BadRequestError, ForbiddenError } from "../errors/main.js";
import { checkFromTo } from "./utils.js";

export function getTransactions(from: number, to: number) {
  checkFromTo(from, to);

  return db.transaction.findMany({
    skip: from,
    take: to - from,
  });
}

export async function transfer(
  from: string,
  to: string,
  amount: number,
  signature: HexString,
  comment?: string
) {
  if (from === to) {
    throw new BadRequestError("You can't transfer money to same account");
  }

  if (amount <= 0) {
    throw new BadRequestError("Amount must be > 0");
  }

  return db.$transaction(async (tx) => {
    const sender = await tx.account.update({
      data: {
        balance: {
          decrement: amount,
        },
      },
      include: {
        User: true,
      },
      where: {
        id: from,
      },
    });

    if (sender.balance < 0) {
      throw new ForbiddenError("transfer more amount than your balance");
    }

    if (
      !ec.verify(
        signature,
        { from, to, amount },
        sender.User.publicKey as HexString
      )
    ) {
      throw new ForbiddenError("Invalid signature");
    }

    const recipient = await tx.account.update({
      data: {
        balance: {
          increment: amount,
        },
      },
      where: {
        id: to,
      },
    });

    if (sender.currencySymbol !== recipient.currencySymbol) {
      throw new ForbiddenError(
        "Cannot perform transaction between different currencies"
      );
    }

    const transaction = await tx.transaction.create({
      data: {
        amount,
        type: "transfer",
        signature,
        senderId: from,
        recipientId: to,
        comment,
      },
    });

    return {
      transaction,
      sender,
      recipient,
    };
  });
}
