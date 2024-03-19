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

import { db, config } from '../../config/app.service.js';
import { ForbiddenError } from '../../errors/main.js';
import { txTransfer } from '../helpers/txTrans.js';
import NP from 'number-precision';
import {
  MatchResult,
  genComment,
  orderMatch,
  updateTradingSchedule,
} from '../helpers/exchangeUtils.js';
import { User } from '../../types/auth.js';

export async function getTradingSchedule(
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  granularity: string
) {
  return await db.tradingSchedule.findMany({
    where: {
      fromCurrencySymbol,
      toCurrencySymbol,
      granularity,
    },
  });
}

export async function getOrderBook(
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  page: number
) {
  const [bids, asks] = await db.$transaction([
    db.order.groupBy({
      where: {
        fromCurrencySymbol,
        toCurrencySymbol,
        type: true,
      },
      _sum: {
        quantity: true,
      },
      by: ['price'],
      orderBy: [{ price: 'desc' }],
      skip: (page - 1) * 50,
      take: 50,
    }),
    db.order.groupBy({
      where: {
        fromCurrencySymbol,
        toCurrencySymbol,
        type: false,
      },
      _sum: {
        quantity: true,
      },
      by: ['price'],
      orderBy: [{ price: 'asc' }],
      skip: (page - 1) * 50,
      take: 50,
    }),
  ]);

  const map = (b: any): { price: number; quantity: number } => ({
    price: b.price,
    quantity: b?._sum?.quantity || 0,
  });

  return {
    bids: bids.map(map),
    asks: asks.map(map),
  };
}

export async function cancelOrder(orderToCancelId: string, user: User) {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.delete({
      where: {
        id: orderToCancelId,
      },
      include: {
        returnAccount: true,
      },
    });

    if (!order) {
      throw new ForbiddenError(`Order with id ${orderToCancelId} not found`);
    }

    if (order.returnAccount.userAlias !== user.alias) {
      throw new ForbiddenError(`Cancel orders that is not your's `);
    }

    await txTransfer(tx, user, {
      from:
        config.exchange_account_prefix +
        (order.type ? order.toCurrencySymbol : order.fromCurrencySymbol),
      to: order.returnAccountId,
      amount: order.type
        ? NP.times(order.quantity, order.price)
        : order.quantity,
      comment: genComment({
        type: 'cancel',
        orderId: order.id,
        pair: order.fromCurrencySymbol + '/' + order.toCurrencySymbol,
        price: order.price,
        quantity: order.quantity,
      }),
    });
  });
}

async function createOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,
  price: number,
  user: User,
  type: boolean // true - buy, false - sell
) {
  if (quantity <= 0) throw new ForbiddenError('Set quantity <= 0');

  const account = await db.account.findUniqueOrThrow({
    where: {
      id: type ? toAccountId : fromAccountId,
    },
  });

  if (account.userAlias !== user.alias) {
    throw new ForbiddenError('Creating order from not your account');
  }

  if (
    (type ? toCurrencySymbol : fromCurrencySymbol) !== account.currencySymbol
  ) {
    throw new ForbiddenError('Buy/sell with wrong currency');
  }

  const exchange_account_id_from =
    config.exchange_account_prefix + fromCurrencySymbol;
  const exchange_account_id_to =
    config.exchange_account_prefix + toCurrencySymbol;

  const realAmount = type ? NP.times(quantity, price) : quantity;
  // const antiRealAmount = !type ? NP.times(quantity, price) : quantity;

  const order = await db.$transaction(async (tx) => {
    const new_order = await tx.order.create({
      data: {
        accountId: !type ? toAccountId : fromAccountId,
        returnAccountId: type ? toAccountId : fromAccountId,
        quantity,
        price,
        type,

        fromCurrencySymbol,
        toCurrencySymbol,
      },
    });

    await txTransfer(tx, user, {
      amount: realAmount,
      from: account.id,
      to: type ? exchange_account_id_to : exchange_account_id_from,
      comment: genComment({
        type: type ? 'buy' : 'sell',
        orderId: new_order.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity,
      }),
    });

    return new_order;
  });

  // Start matching
  let result: MatchResult | undefined;

  while (result?.type !== 'all_matched') {
    await db.$transaction(async (tx) => {
      result = await orderMatch(tx, fromCurrencySymbol, toCurrencySymbol);
    });

    if (!result) continue;

    if (result.type === 'match_success') {
      if (!result.data) continue;

      await updateTradingSchedule(
        result.data.fromCurrencySymbol,
        result.data.toCurrencySymbol,
        result.data.price,
        result.data.quantity
      );
    }
  }

  return order;
}

export function makeBuyOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,

  price: number,
  user: User
) {
  return createOrder(
    fromAccountId,
    toAccountId,
    fromCurrencySymbol,
    toCurrencySymbol,
    quantity,
    price,
    user,
    true
  );
}

export function makeSellOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,
  price: number,
  user: User
) {
  return createOrder(
    fromAccountId,
    toAccountId,
    fromCurrencySymbol,
    toCurrencySymbol,
    quantity,
    price,
    user,
    false
  );
}
