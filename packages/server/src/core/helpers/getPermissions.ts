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

import { db } from '../../config/app.service.js';
import { JWTPermissions } from '../../types/auth.js';

export async function getPermissions(userAlias: string) {
  const rawPermissions =
    (await db.userPermission.findUnique({
      where: { userAlias },
    })) || {};

  return {
    ...removeFalseValues({ ...rawPermissions, root: userAlias === 'root' }),
    user: true,
  };
}

export function removeFalseValues(obj: JWTPermissions): JWTPermissions {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!(value === false || value === null)) {
      result[key] = value;
    }
  }

  delete result.userAlias;

  return result as JWTPermissions;
}

export function mapPermissions(rawPermissions: JWTPermissions): JWTPermissions {
  const extend = rawPermissions.user
    ? {
        // Read
        getAccounts: true,
        getTransactions: true,
        getOrders: true,

        // Write
        createAccounts: true,
        blockAccounts: true,
        createTransactions: true,
        createOrders: true,
        cancelOrders: true,
        createSmartContracts: true,
        executeSmartContracts: true,
      }
    : {};

  return {
    ...rawPermissions,
    ...extend,
  };
}
