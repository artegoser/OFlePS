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

import { HexString, ec, genSalt, hash } from "ofleps-utils";
import { db, config } from "../config/app.service.js";
import { BadRequestError, ForbiddenError } from "../errors/main.js";
import { checkFromTo } from "./utils.js";

export function getTransactions(from: number, to: number) {
  checkFromTo(from, to);

  return db.transaction.findMany({
    skip: from,
    take: to - from,
  });
}

export async function transfer({
  from,
  to,
  amount,
  signature,
  comment,
  salt,
}: {
  from: string;
  to: string;
  amount: number;
  signature: HexString;
  comment?: string;
  salt: string;
}) {
  if (from === to) {
    throw new BadRequestError("You can't transfer money to same account");
  }

  if (amount <= 0) {
    throw new BadRequestError("Amount must be > 0");
  }

  return db.$transaction(async (tx) => {
    const senderAccount = await tx.account.update({
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

    if (senderAccount.blocked) {
      throw new ForbiddenError("Sender account is blocked");
    }

    if (senderAccount.balance < 0) {
      throw new ForbiddenError("transfer more amount than your balance");
    }

    if (!senderAccount.User.approved) {
      throw new ForbiddenError("Sender account's user is not approved");
    }

    if (senderAccount.User.blocked) {
      throw new ForbiddenError("Sender account's user is blocked");
    }

    if (
      !ec.verify(
        signature,
        { from, to, amount, comment, salt, type: "transfer" },
        senderAccount.User.publicKey as HexString
      )
    ) {
      throw new ForbiddenError(
        "Invalid signature (Maybe you're sending not from your account)"
      );
    }

    const recipientAccount = await tx.account.update({
      data: {
        balance: {
          increment: amount,
        },
      },
      include: {
        User: true,
      },
      where: {
        id: to,
      },
    });

    if (senderAccount.currencySymbol !== recipientAccount.currencySymbol) {
      throw new ForbiddenError(
        "Cannot perform transaction between different currencies"
      );
    }

    if (recipientAccount.blocked) {
      throw new ForbiddenError("Recipient account is blocked");
    }

    if (!recipientAccount.User.approved) {
      throw new ForbiddenError("Recipient account's user is not approved");
    }

    if (recipientAccount.User.blocked) {
      throw new ForbiddenError("Recipient account's user is blocked");
    }

    const transaction = await tx.transaction.create({
      data: {
        amount,
        type: "transfer",
        from,
        to,
        comment,
        signature,
        salt,
      },
    });

    return transaction;
  });
}
