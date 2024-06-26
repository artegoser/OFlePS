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

import jwt from 'jsonwebtoken';
import { config } from '../config/app.service.js';

export interface JWTPermissions {
  // Special
  issueCurrency?: boolean;
  issueCurrencyValue?: string | null;

  // Read
  getAccounts?: boolean;
  getTransactions?: boolean;
  getOrders?: boolean;

  // Write
  createAccounts?: boolean;
  blockAccounts?: boolean;
  createTransactions?: boolean;
  createOrders?: boolean;
  cancelOrders?: boolean;
  createSmartContracts?: boolean;
  executeSmartContracts?: boolean;

  // Roles
  user?: boolean;
  root?: boolean;
}

export interface JWTUser {
  alias: string;
  permissions: JWTPermissions;
}

export function jwtSign(payload: JWTUser) {
  return jwt.sign(payload, config.jwt_secret, { expiresIn: '1d' });
}
