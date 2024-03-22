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
import {
  setApproveUser,
  setBlockAccount,
  setBlockUser,
} from '../core/main/root.js';
import {
  account_id,
  alias,
  comment,
  currencySymbol,
  description,
  name,
} from '../types/schema.js';

import { perms } from '../config/trpc.js';

export const root = router({
  setBlockUser: privateProcedure
    .use(perms('root'))
    .input(
      z.object({
        alias,
        block: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      return setBlockUser(input.alias, input.block);
    }),
  setApproveUser: privateProcedure
    .use(perms('root'))
    .input(
      z.object({
        alias,
        approve: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      return setApproveUser(input.alias, input.approve);
    }),
  setBlockAccount: privateProcedure
    .use(perms('root'))
    .input(
      z.object({
        accountId: account_id,
        block: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      return setBlockAccount(input.accountId, input.block);
    }),
  addCurrency: privateProcedure
    .use(perms('root'))
    .input(
      z.object({
        symbol: currencySymbol,
        name,
        description,
        type: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      return core.root.addCurrency({
        symbol: input.symbol,
        name: input.name,
        description: input.description,
        type: input.type,
      });
    }),
  issue: privateProcedure
    .input(
      z.object({
        to: account_id,
        amount: z.number(),
        comment,
      })
    )
    .mutation(({ input, ctx }) => {
      return core.root.issue({
        to: input.to,
        amount: input.amount,
        comment: input.comment,
        permissions: ctx.permissions,
      });
    }),
});

export default root;
