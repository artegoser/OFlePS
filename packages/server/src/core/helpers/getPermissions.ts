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

export async function getPermissions(userAlias: string) {
  const rawPermissions = await db.userPermission.findUnique({
    where: { userAlias },
  });

  if (!rawPermissions) {
    throw new Error('Permissions not found');
  }

  return removeFalseValues(rawPermissions);
}

function removeFalseValues<T extends object>(obj: T) {
  const result: any = {};

  for (const key in obj) {
    if (obj[key] !== false || obj[key] !== null) {
      result[key] = obj[key];
    }
  }

  delete result.userAlias;

  return result;
}
