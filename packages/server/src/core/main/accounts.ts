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
import { ForbiddenError, NotFoundError } from '../../errors/main.js';
import { getUserByAlias } from './user.js';
import { getCurrencyBySymbol } from './currencies.js';
import { User } from '../../types/auth.js';

export async function createAccount({
  userObj,
  alias,
  name,
  description,
  currencySymbol,
}: {
  userObj: User;
  alias: string;
  name: string;
  description: string;
  currencySymbol: string;
}) {
  const user = await getUserByAlias(userObj.alias);
  const currency = await getCurrencyBySymbol(currencySymbol);

  if (!user) {
    throw new NotFoundError(`User with alias "${userObj.alias}"`);
  }

  if (!currency) {
    throw new NotFoundError(`Currency with symbol "${currencySymbol}"`);
  }

  if (user.blocked) {
    throw new ForbiddenError(
      `User with alias "${userObj.alias}" is blocked and cannot create an account`
    );
  }

  return await db.account.create({
    data: {
      id: `${user.alias}/${alias}`,
      name,
      description,
      currencySymbol,
      balance: 0,
      userAlias: user.alias,
    },
  });
}

export async function getAccountById(id: string, user: User) {
  const account = await db.account.findUnique({ where: { id } });

  if (!account) {
    throw new NotFoundError(`Account with id ${id}`);
  }

  if (account.userAlias !== user.alias) {
    throw new ForbiddenError('Receiving an account data that is not yours');
  }

  return account;
}

export async function getAccountsByUserAlias(userAlias: string) {
  return await db.account.findMany({ where: { userAlias } });
}
