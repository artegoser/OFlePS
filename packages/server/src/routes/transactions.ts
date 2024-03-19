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

import { router, privateProcedure } from '../config/trpc.js';
import { z } from 'zod';
import core from '../core/main.js';

const transactions = router({
  get: privateProcedure
    .input(
      z.object({
        page: z.number(),
        accountId: z.string(),
        signature: z.string(),
      })
    )
    .query(({ input, ctx }) => {
      return core.transactions.getTransactions(
        input.page,
        input.accountId,
        ctx.user
      );
    }),
  transfer: privateProcedure
    .input(
      z.object({
        from: z.string(),
        to: z.string(),
        amount: z.number(),
        comment: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      return core.transactions.transfer(ctx.user, {
        from: input.from,
        to: input.to,
        amount: input.amount,
        comment: input.comment,
      });
    }),
});

export default transactions;
