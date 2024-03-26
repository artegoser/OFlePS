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
import { ForbiddenError } from '../../errors/main.js';
import { JWTPermissions } from '../../types/auth.js';

export function setBlockUser(alias: string, block: boolean) {
  return db.user.update({
    where: {
      alias,
    },
    data: {
      blocked: block,
    },
  });
}
export function setApproveUser(alias: string, approve: boolean) {
  return db.user.update({
    where: {
      alias,
    },
    data: {
      approved: approve,
    },
  });
}

export function setBlockAccount(accountId: string, block: boolean) {
  return db.account.update({
    where: {
      id: accountId,
    },
    data: {
      blocked: block,
    },
  });
}

export function addCurrency({
  symbol,
  name,
  description,
  type,
}: {
  symbol: string;
  name: string;
  description: string;
  type?: string;
}) {
  return db.currency.upsert({
    where: {
      symbol,
    },
    update: {
      name,
      description,
      type,
    },
    create: {
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
  permissions,
}: {
  to: string;
  amount: number;
  comment?: string;
  permissions: JWTPermissions;
}) {
  if (!(permissions.root || permissions.issueCurrency)) {
    throw new ForbiddenError('Permission denied');
  }

  return await db.$transaction(async (tx) => {
    const account = await tx.account.update({
      where: {
        id: to,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    if (
      !(
        permissions.root ||
        permissions.issueCurrencyValue === account.currencySymbol
      )
    ) {
      throw new ForbiddenError(
        "Permission denied, you can't issue this currency"
      );
    }

    return await tx.transaction.create({
      data: {
        from: to,
        to,
        amount,
        comment,
        type: 'issue',
        currencySymbol: account.currencySymbol,
      },
    });
  });
}
