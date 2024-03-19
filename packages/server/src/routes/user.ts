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

const user = router({
  register: publicProcedure
    .input(
      z.object({
        alias: z.string(),
        name: z.string(),
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.user.registerUser(
        input.alias,
        input.name,
        input.email,
        input.password
      );
    }),
  signin: publicProcedure
    .input(
      z.object({
        alias: z.string(),
        password: z.string(),
      })
    )
    .query(({ input }) => {
      return core.user.signin(input.alias, input.password);
    }),
  getByAlias: publicProcedure.input(z.string()).query(({ input }) => {
    return core.user.getUserByAlias(input);
  }),
  get: privateProcedure.query(({ ctx }) => {
    return core.user.getUserByAlias(ctx.user.alias);
  }),
});

export default user;
