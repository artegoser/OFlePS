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
import core from '../core/main.js';
import { currencySymbol, page } from '../types/schema.js';

const currencies = router({
  getBySymbol: publicProcedure.input(currencySymbol).query(({ input }) => {
    return core.currencies.getCurrencyBySymbol(input);
  }),
  get: publicProcedure.input(z.object({ page })).query(({ input }) => {
    return core.currencies.getCurrencies(input.page);
  }),
});

export default currencies;
