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

import { ConfigService } from './config.service.js';
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
export const config = new ConfigService();

let exchange;
try {
  exchange = await db.user.create({
    data: {
      alias: config.exchange_account_prefix + 'user',
      email: 'none',
      name: 'none',
      hashed_password: 'none',
      approved: true,
    },
  });
} catch {
  exchange = await db.user.findUnique({
    where: { alias: config.exchange_account_prefix + 'user' },
  });
}

if (!exchange) throw new Error('Unknown');

for (const currency of config.currencies) {
  try {
    await db.currency.create({
      data: {
        name: currency,
        symbol: currency,
        description: 'Auto generated',
      },
    });

    await db.account.create({
      data: {
        id: config.exchange_account_prefix + currency,
        name: currency,
        currencySymbol: currency,
        userAlias: exchange.alias,
      },
    });

    console.log(`generated ${currency}`);
  } catch {
    console.log(`already generated ${currency}`);
  }
}

export type Db = typeof db;
export type txDb = Omit<
  Db,
  '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
>;
