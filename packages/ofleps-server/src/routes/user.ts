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
import { HexString } from "ofleps-utils";
import core from "../core/main.js";

const user = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string(),
        publicKey: z.string(),
        signature: z.string(),
      })
    )
    .mutation(({ input }) => {
      return core.user.registerUser(
        input.name,
        input.email,
        input.publicKey as HexString,
        input.signature as HexString
      );
    }),
  get: publicProcedure
    .input(z.object({ from: z.number(), to: z.number() }))
    .query(({ input }) => {
      return core.user.getUsers(input.from, input.to);
    }),
  getById: publicProcedure.input(z.string()).query(({ input }) => {
    return core.user.getUserById(input);
  }),
  getByEmail: publicProcedure.input(z.string()).query(({ input }) => {
    return core.user.getUserByEmail(input);
  }),
  getByPublicKey: publicProcedure.input(z.string()).query(({ input }) => {
    return core.user.getUserByPublicKey(input as HexString);
  }),
});

export default user;
