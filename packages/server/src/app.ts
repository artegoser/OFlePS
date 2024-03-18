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

import { router } from './config/trpc.js';
import { config } from './config/app.service.js';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';

import root from './routes/root.js';
import user from './routes/user.js';
import transactions from './routes/transactions.js';
import accounts from './routes/accounts.js';
import currencies from './routes/currencies.js';
import smartContracts from './routes/smartContracts.js';
import exchange from './routes/exchange.js';

const appRouter = router({
  root,
  transactions,
  user,
  accounts,
  currencies,
  smartContracts,
  exchange,
});

const server = createHTTPServer({
  middleware: cors(),
  router: appRouter,
});

server.listen(config.port, config.host);
console.log(`server is running at ${config.host}:${config.port}`);

export type AppRouter = typeof appRouter;

import { ExchangeCommentData } from './core/helpers/orderMatch.js';
export { ExchangeCommentData };
