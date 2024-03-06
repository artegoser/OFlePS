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

import { router, publicProcedure } from "./trpc";
import app from "./config/app.service";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";

const appRouter = router({
  transactions: publicProcedure.query(() => {
    const transactions = app.prisma.transaction.findMany();
    if (transactions) {
      return transactions;
    }
    return;
  }),
});

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
