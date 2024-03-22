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

import { db, config } from '../../config/app.service.js';

import * as bcrypt from 'bcrypt';
import { BadRequestError, NotFoundError } from '../../errors/main.js';
import { jwtSign, JWTPermissions } from '../../types/auth.js';
import { getPermissions } from '../helpers/getPermissions.js';

export async function registerUser(
  alias: string,
  name: string,
  email: string,
  password: string
) {
  const hashed_password = await bcrypt.hash(
    password,
    alias === 'root' ? 14 : 10
  );

  const signedJwt = jwtSign({
    alias,
    permissions: { user: true, ...(alias === 'root' ? { root: true } : {}) },
  });

  await db.user.create({
    data: {
      alias,
      name,
      email,
      hashed_password,
      approved: config.auto_approve,
    },
  });

  return { jwt: signedJwt };
}

export async function signin(alias: string, password: string) {
  const user = await db.user.findUnique({ where: { alias } });
  const permissions: JWTPermissions = await getPermissions(alias);

  if (!user) {
    throw new NotFoundError(`User with alias: ${alias}`);
  }

  if (!(await bcrypt.compare(password, user.hashed_password))) {
    throw new BadRequestError(`Invalid password`);
  }

  const signedJwt = jwtSign({
    alias,
    permissions: { ...permissions, user: true },
  });

  return { jwt: signedJwt };
}

export async function getUserByAlias(alias: string) {
  return await db.user.findUnique({
    where: { alias },
    select: { alias: true, name: true, blocked: true, approved: true },
  });
}
