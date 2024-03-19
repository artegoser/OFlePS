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

import { genSalt } from '@ofleps/utils';

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export async function registerUser(
  alias: string,
  name: string,
  email: string,
  password: string
) {
  const hashed_password = await bcrypt.hash(password, 10);
  const totp_key = genSalt();
  const signedJwt = jwt.sign({ alias, totp_key }, config.jwt_secret);

  await db.user.create({
    data: {
      alias,
      name,
      email,
      hashed_password,
      approved: config.auto_approve,
    },
  });

  return { totp_key, signedJwt };
}

export async function getUserByAlias(alias: string) {
  return await db.user.findUnique({
    where: { alias },
    select: { alias: true, name: true, blocked: true, approved: true },
  });
}
