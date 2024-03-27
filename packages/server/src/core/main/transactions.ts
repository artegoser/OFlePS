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

import { db } from '../../config/app.service.js';
import { emitter } from '../../config/emitter.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../errors/main.js';
import { JWTUser } from '../../types/auth.js';
import { TransactionReq, txTransfer } from '../helpers/txTrans.js';

export async function getTransactionsByAccountId(
  page: number,
  accountId: string,
  user: JWTUser
) {
  const account = await db.account.findUnique({
    where: {
      id: accountId,
    },
  });

  if (!account) {
    throw new NotFoundError(`Account with id "${accountId}"`);
  }

  if (account.userAlias !== user.alias) {
    throw new ForbiddenError('Getting not your account');
  }

  return await db.transaction.findMany({
    skip: (page - 1) * 50,
    take: 50,
    where: {
      OR: [
        {
          from: accountId,
        },
        {
          to: accountId,
        },
      ],
    },
    orderBy: {
      date: 'desc',
    },
  });
}

export async function getTransactions(page: number, user: JWTUser) {
  const accounts = (
    await db.account.findMany({
      where: {
        userAlias: user.alias,
      },
    })
  ).map((a) => a.id);

  return await db.transaction.findMany({
    skip: (page - 1) * 50,
    take: 50,
    where: {
      OR: [
        {
          from: {
            in: accounts,
          },
        },
        {
          to: {
            in: accounts,
          },
        },
      ],
    },
    orderBy: {
      date: 'desc',
    },
  });
}

export async function transfer(
  user: JWTUser,
  { from, to, amount, comment }: TransactionReq
) {
  if (from === to) {
    throw new BadRequestError("You can't transfer money to same account");
  }

  if (amount <= 0) {
    throw new BadRequestError('Amount must be > 0');
  }

  const transaction = await db.$transaction(async (tx) => {
    return await txTransfer(tx, user, {
      from,
      to,
      amount,
      comment,
    });
  });

  emitter.emit(`transaction ${transaction.from}`, transaction);
  emitter.emit(`transaction ${transaction.to}`, transaction);

  return transaction;
}
