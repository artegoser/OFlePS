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

import { ForbiddenError } from '../../errors/main.js';
import type { txDb } from '../../config/app.service.js';
import { JWTUser } from '../../types/auth.js';

export interface TransactionReq {
  from: string;
  to: string;
  amount: number;

  comment?: string;
}

export async function txTransfer(
  tx: txDb,
  user: JWTUser | null,
  req: TransactionReq
) {
  const { from, to, amount, comment } = req;

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
    throw new ForbiddenError('Sender account is blocked');
  }

  if (senderAccount.balance < 0) {
    throw new ForbiddenError(
      `transfer more amount than your balance (${senderAccount.name}, ${amount})`
    );
  }

  if (!senderAccount.User.approved) {
    throw new ForbiddenError("Sender account's user is not approved");
  }

  if (senderAccount.User.blocked) {
    throw new ForbiddenError("Sender account's user is blocked");
  }

  if (user && senderAccount.User.alias !== user.alias) {
    throw new ForbiddenError("Sending from not your's account");
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
      'Cannot perform transaction between different currencies'
    );
  }

  if (recipientAccount.blocked) {
    throw new ForbiddenError('Recipient account is blocked');
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
      type: 'transfer',
      from,
      to,
      comment,
      currencySymbol: senderAccount.currencySymbol,
    },
  });

  return transaction;
}
