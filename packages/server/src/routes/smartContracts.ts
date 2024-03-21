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
import { code, description, method, name, params } from '../types/schema.js';

const smartContracts = router({
  getById: publicProcedure.input(z.string()).query(({ input }) => {
    return core.smartContracts.getSmartContractById(input);
  }),
  create: privateProcedure
    .use(perms('createSmartContracts'))
    .input(
      z.object({
        name,
        description,
        code,
      })
    )
    .mutation(({ input, ctx }) => {
      return core.smartContracts.createSmartContract(
        input.name,
        input.description,
        input.code,
        ctx
      );
    }),
  execute: privateProcedure
    .use(perms('executeSmartContracts'))
    .input(
      z.object({
        id: z.string(),
        request: z.object({
          method,
          params,
        }),
      })
    )
    .mutation(({ input, ctx }) => {
      return core.smartContracts.executeSmartContract(
        input.id,
        input.request,
        ctx
      );
    }),
});

export default smartContracts;
