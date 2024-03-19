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

import { router, publicProcedure, privateProcedure } from '../config/trpc.js';
import { z } from 'zod';
import core from '../core/main.js';
import { config } from '../config/app.service.js';

const exchange = router({
  getGranularities: publicProcedure.query(() => config.granularities),
  getTradingSchedule: publicProcedure
    .input(
      z.object({
        fromCurrencySymbol: z.string(),
        toCurrencySymbol: z.string(),
        granularity: z.string(),
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
        fromCurrencySymbol: z.string(),
        toCurrencySymbol: z.string(),
        page: z.number(),
      })
    )
    .query(({ input }) => {
      return core.exchange.getOrderBook(
        input.fromCurrencySymbol,
        input.toCurrencySymbol,
        input.page
      );
    }),
  cancel: privateProcedure
    .input(
      z.object({
        orderToCancelId: z.string(),
        signature: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      return core.exchange.cancelOrder(input.orderToCancelId, ctx.user);
    }),

  sell: privateProcedure
    .input(
      z.object({
        fromAccountId: z.string(),
        toAccountId: z.string(),
        fromCurrencySymbol: z.string(),
        toCurrencySymbol: z.string(),
        quantity: z.number(),
        price: z.number(),
        signature: z.string(),
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
        ctx.user
      );
    }),

  buy: privateProcedure
    .input(
      z.object({
        fromAccountId: z.string(),
        toAccountId: z.string(),
        fromCurrencySymbol: z.string(),
        toCurrencySymbol: z.string(),
        quantity: z.number(),
        price: z.number(),
        signature: z.string(),
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
        ctx.user
      );
    }),
});

export default exchange;
