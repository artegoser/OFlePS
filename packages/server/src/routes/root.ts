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

import { router, publicProcedure } from '../config/trpc.js';
import { z } from 'zod';
import core from '../core/main/main.js';
import { HexString } from '@ofleps/utils';
import {
  setApproveUser,
  setBlockAccount,
  setBlockUser,
} from '../core/main/root.js';

export const root = router({
  setBlockUser: publicProcedure
    .input(
      z.object({
        userPk: z.string(),
        block: z.boolean(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return setBlockUser(
        input.userPk as HexString,
        input.block,
        input.signature as HexString
      );
    }),
  setApproveUser: publicProcedure
    .input(
      z.object({
        userPk: z.string(),
        approve: z.boolean(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return setApproveUser(
        input.userPk as HexString,
        input.approve,
        input.signature as HexString
      );
    }),
  setBlockAccount: publicProcedure
    .input(
      z.object({
        accountId: z.string(),
        block: z.boolean(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return setBlockAccount(
        input.accountId,
        input.block,
        input.signature as HexString
      );
    }),
  addCurrency: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        name: z.string(),
        description: z.string(),
        type: z.string().optional(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.root.addCurrency({
        symbol: input.symbol,
        name: input.name,
        description: input.description,
        type: input.type,
        signature: input.signature as HexString,
      });
    }),
  issue: publicProcedure
    .input(
      z.object({
        to: z.string(),
        amount: z.number(),
        comment: z.string().optional(),
        signature: z.string(),
        salt: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.root.issue({
        to: input.to,
        amount: input.amount,
        comment: input.comment,
        salt: input.salt,
        signature: input.signature as HexString,
      });
    }),
});

export default root;