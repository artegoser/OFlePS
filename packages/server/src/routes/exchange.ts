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

import {
  router,
  publicProcedure,
  privateProcedure,
  perms,
} from '../config/trpc.js';
import { z } from 'zod';
import core from '../core/main.js';
import { config } from '../config/app.service.js';
import {
  account_id,
  amount,
  currencySymbol,
  granularity,
  page,
} from '../types/schema.js';
import { observable } from '@trpc/server/observable';
import { emitter } from '../config/app.service.js';

const exchange = router({
  getGranularities: publicProcedure.query(() => config.granularities),
  getTradingSchedule: publicProcedure
    .input(
      z.object({
        fromCurrencySymbol: currencySymbol,
        toCurrencySymbol: currencySymbol,
        granularity: granularity,
      })
    )
    .query(({ input }) => {
      return core.exchange.getTradingSchedule(
        input.fromCurrencySymbol,
        input.toCurrencySymbol,
        input.granularity
      );
    }),
  getOrderBook: publicProcedure
    .input(
      z.object({
        fromCurrencySymbol: currencySymbol,
        toCurrencySymbol: currencySymbol,
        page,
      })
    )
    .query(({ input }) => {
      return core.exchange.getOrderBook(
        input.fromCurrencySymbol,
        input.toCurrencySymbol,
        input.page
      );
    }),
  orderBookSubscription: publicProcedure
    .input(
      z.object({
        fromCurrencySymbol: currencySymbol,
        toCurrencySymbol: currencySymbol,
      })
    )
    .subscription(({ input }) =>
      observable((emit) => {
        emitter.on(
          'new_order',
          (fromCurrencySymbol, toCurrencySymbol, price, quantity, type) => {
            if (
              fromCurrencySymbol === input.fromCurrencySymbol &&
              toCurrencySymbol === input.toCurrencySymbol
            ) {
              emit.next({
                fromCurrencySymbol,
                toCurrencySymbol,
                price,
                quantity,
                type,
              });
            }
          }
        );
      })
    ),
  getOrders: privateProcedure.use(perms('getOrders')).query(({ ctx }) => {
    return core.exchange.getOrders(ctx);
  }),
  cancel: privateProcedure
    .use(perms('cancelOrders'))
    .input(
      z.object({
        orderToCancelId: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      return core.exchange.cancelOrder(input.orderToCancelId, ctx);
    }),

  sell: privateProcedure
    .use(perms('createOrders'))
    .input(
      z.object({
        fromAccountId: account_id,
        toAccountId: account_id,
        fromCurrencySymbol: currencySymbol,
        toCurrencySymbol: currencySymbol,
        quantity: amount,
        price: amount,
      })
    )
    .mutation(({ input, ctx }) => {
      return core.exchange.makeSellOrder(
        input.fromAccountId,
        input.toAccountId,
        input.fromCurrencySymbol,
        input.toCurrencySymbol,
        input.quantity,
        input.price,
        ctx
      );
    }),

  buy: privateProcedure
    .use(perms('createOrders'))
    .input(
      z.object({
        fromAccountId: account_id,
        toAccountId: account_id,
        fromCurrencySymbol: currencySymbol,
        toCurrencySymbol: currencySymbol,
        quantity: amount,
        price: amount,
      })
    )
    .mutation(({ input, ctx }) => {
      return core.exchange.makeBuyOrder(
        input.fromAccountId,
        input.toAccountId,
        input.fromCurrencySymbol,
        input.toCurrencySymbol,
        input.quantity,
        input.price,
        ctx
      );
    }),
});

export default exchange;
