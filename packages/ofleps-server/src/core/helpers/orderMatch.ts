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

import { config, db, type txDb } from '../../config/app.service.js';
import NP from 'number-precision';
import { txTransfer } from './txTrans.js';

export interface MatchResult {
  type: 'all_matched' | 'match_success';
  data?: {
    fromCurrencySymbol: string;
    toCurrencySymbol: string;
    price: number;
    quantity: number;
  };
}

interface CommentData {
  type: string;
  orderId: string;
  pair: string;
  price: number;
  quantity: number;
}

export function genComment(obj: CommentData) {
  return `@exchange${JSON.stringify(obj)}`;
}

export async function orderMatch(
  tx: txDb,
  fromCurrencySymbol: string,
  toCurrencySymbol: string
): Promise<MatchResult> {
  const highestBuyOrder = await tx.order.findFirst({
    where: { type: true, fromCurrencySymbol, toCurrencySymbol },
    orderBy: [{ price: 'desc' }, { date: 'asc' }],
  });

  const lowestSellOrder = await tx.order.findFirst({
    where: { type: false, fromCurrencySymbol, toCurrencySymbol },
    orderBy: [{ price: 'asc' }, { date: 'asc' }],
  });

  if (!highestBuyOrder || !lowestSellOrder) {
    return {
      type: 'all_matched',
    };
  }

  if (highestBuyOrder.price >= lowestSellOrder.price) {
    const quantityToTrade = Math.min(
      highestBuyOrder.quantity,
      lowestSellOrder.quantity
    );

    const price = lowestSellOrder.price;

    const sellerAmount = NP.times(quantityToTrade, lowestSellOrder.price);
    const buyerAmount = NP.times(quantityToTrade, highestBuyOrder.price);

    // Update the quantities of the matched orders
    if (highestBuyOrder.quantity > quantityToTrade) {
      await tx.order.update({
        where: { id: highestBuyOrder.id },
        data: { quantity: { decrement: quantityToTrade } },
      });
    } else {
      await tx.order.delete({ where: { id: highestBuyOrder.id } });
    }

    if (lowestSellOrder.quantity > quantityToTrade) {
      await tx.order.update({
        where: { id: lowestSellOrder.id },
        data: { quantity: { decrement: quantityToTrade } },
      });
    } else {
      await tx.order.delete({ where: { id: lowestSellOrder.id } });
    }

    //Perform transactions from exchange accounts
    // Seller gets the money
    await txTransfer(tx, {
      amount: sellerAmount,
      from: config.exchange_account_prefix + toCurrencySymbol,
      to: lowestSellOrder.accountId,
      comment: genComment({
        type: 'sell_success',
        orderId: lowestSellOrder.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity: quantityToTrade,
      }),
    });

    // Buyer gets the money
    await txTransfer(tx, {
      amount: quantityToTrade,
      from: config.exchange_account_prefix + fromCurrencySymbol,
      to: highestBuyOrder.accountId,
      comment: genComment({
        type: 'buy_success',
        orderId: highestBuyOrder.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity: quantityToTrade,
      }),
    });

    // Refund unused funds to the buyer
    if (buyerAmount > sellerAmount) {
      await txTransfer(tx, {
        amount: NP.minus(buyerAmount, sellerAmount),
        from: config.exchange_account_prefix + toCurrencySymbol,
        to: highestBuyOrder.returnAccountId,
        comment: genComment({
          type: 'refund_unutilized_funds',
          orderId: highestBuyOrder.id,
          pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
          price,
          quantity: quantityToTrade,
        }),
      });
    }

    await tx.completeOrder.create({
      data: {
        price,
        quantity: quantityToTrade,
        fromCurrencySymbol,
        toCurrencySymbol,
      },
    });

    return {
      type: 'match_success',
      data: {
        fromCurrencySymbol,
        toCurrencySymbol,
        price,
        quantity: quantityToTrade,
      },
    };
  }

  return { type: 'all_matched' };
}

export async function updateTradingSchedule(
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  price: number,
  quantity: number
) {
  const granularities = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

  for (const granularity of granularities) {
    const dateStart = new Date();

    if (granularity === '1m') {
      dateStart.setSeconds(0, 0);
      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 1),
          },
        },
      });
    }

    if (granularity === '5m') {
      const roundedMinutes = Math.floor(dateStart.getMinutes() / 5) * 5;
      dateStart.setMinutes(roundedMinutes, 0, 0);
      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 2),
          },
        },
      });
    }

    if (granularity === '15m') {
      const roundedMinutes = Math.floor(dateStart.getMinutes() / 15) * 15;
      dateStart.setMinutes(roundedMinutes, 0, 0);

      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 7),
          },
        },
      });
    }

    if (granularity === '30m') {
      const roundedMinutes = Math.floor(dateStart.getMinutes() / 30) * 30;
      dateStart.setMinutes(roundedMinutes, 0, 0);

      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 15),
          },
        },
      });
    }

    if (granularity === '1h') {
      dateStart.setMinutes(0, 0, 0);

      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 30),
          },
        },
      });
    }

    if (granularity === '4h') {
      const roundedHours = Math.floor(dateStart.getHours() / 4) * 4;
      dateStart.setHours(roundedHours, 0, 0, 0);

      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 60),
          },
        },
      });
    }

    if (granularity === '1d') {
      dateStart.setHours(0, 0, 0, 0);

      await db.tradingSchedule.deleteMany({
        where: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart: {
            lte: new Date(dateStart.getDate() - 180),
          },
        },
      });
    }

    if (granularity === '1w') {
      const roundedWeeks = Math.floor(dateStart.getDay() / 7) * 7;
      dateStart.setDate(dateStart.getDate() - roundedWeeks);

      dateStart.setHours(0, 0, 0, 0);
    }

    await db.$transaction(async (tx) => {
      const tradingSchedule = await tx.tradingSchedule.upsert({
        where: {
          fromCurrencySymbol_toCurrencySymbol_granularity_dateStart: {
            fromCurrencySymbol,
            toCurrencySymbol,
            granularity,
            dateStart,
          },
        },
        create: {
          fromCurrencySymbol,
          toCurrencySymbol,
          granularity,
          dateStart,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: quantity,
        },
        update: {
          volume: {
            increment: quantity,
          },
          close: price,
        },
      });

      await tx.tradingSchedule.update({
        where: {
          fromCurrencySymbol_toCurrencySymbol_granularity_dateStart: {
            fromCurrencySymbol,
            toCurrencySymbol,
            granularity,
            dateStart,
          },
        },
        data: {
          high: {
            set: Math.max(tradingSchedule.high, price),
          },
          low: {
            set: Math.min(tradingSchedule.low, price),
          },
        },
      });
    });
  }
}
