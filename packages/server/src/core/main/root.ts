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

import { HexString, ec } from '@ofleps/utils';
import { db, config } from '../../config/app.service.js';
import { ForbiddenError } from '../../errors/main.js';

const invalidSign = new ForbiddenError('Invalid signature for root');

export function setBlockUser(
  alias: string,
  block: boolean,
  signature: HexString
) {
  if (!ec.verify(signature, { alias, block }, config.root_public_key)) {
    throw invalidSign;
  }

  return db.user.update({
    where: {
      alias,
    },
    data: {
      blocked: block,
    },
  });
}
export function setApproveUser(
  alias: string,
  approve: boolean,
  signature: HexString
) {
  if (!ec.verify(signature, { alias, approve }, config.root_public_key)) {
    throw invalidSign;
  }

  return db.user.update({
    where: {
      alias,
    },
    data: {
      approved: approve,
    },
  });
}

export function setBlockAccount(
  accountId: string,
  block: boolean,
  signature: HexString
) {
  if (!ec.verify(signature, { accountId, block }, config.root_public_key)) {
    throw invalidSign;
  }

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
    throw invalidSign;
  }

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
  signature,
  timestamp,
}: {
  to: string;
  amount: number;
  comment?: string;
  signature: HexString;
  timestamp: number;
}) {
  if (timestamp < Date.now() - 2 * 1000) {
    throw new Error('Invalid timestamp');
  }

  if (
    !ec.verify(
      signature,
      { from: 'root', to, amount, comment, timestamp, type: 'issue' },
      config.root_public_key
    )
  ) {
    throw invalidSign;
  }

  return db.$transaction(async (tx) => {
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
