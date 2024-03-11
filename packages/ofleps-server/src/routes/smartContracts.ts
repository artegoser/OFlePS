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

import { router, publicProcedure } from "../config/trpc.js";
import { z } from "zod";
import core from "../core/main/main.js";
import { HexString } from "ofleps-utils";

const smartContracts = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        code: z.string(),
        authorId: z.string(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.smartContracts.createSmartContract(
        input.name,
        input.description,
        input.code,
        input.authorId,
        input.signature as HexString
      );
    }),
  execute: publicProcedure
    .input(
      z.object({
        id: z.string(),
        request: z.object({
          method: z.string(),
          params: z.array(z.string().or(z.number()).or(z.boolean())),
        }),
        callerId: z.string(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.smartContracts.executeSmartContract(
        input.id,
        input.request,
        input.callerId,
        input.signature as HexString
      );
    }),
});

export default smartContracts;
