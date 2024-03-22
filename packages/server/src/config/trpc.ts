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

import { initTRPC, TRPCError } from '@trpc/server';
import { config } from './app.service.js';
import jwt from 'jsonwebtoken';

import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import { JWTPermissions, JWTUser } from '../types/auth.js';
import { ZodError } from 'zod';
import { mapPermissions } from '../core/helpers/getPermissions.js';

export const createContext = ({ req, res }: CreateHTTPContextOptions) => {
  return { req, res };
};

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create({
  errorFormatter(opts) {
    const { shape, error } = opts;
    return {
      ...shape,
      message:
        error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
          ? error.cause.issues.map((s) => `${s.path}: ${s.message}`).join('\n')
          : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const publicProcedure = t.procedure;
export const router = t.router;

export const privateProcedure = t.procedure.use(async ({ ctx, next }) => {
  const jwt_token = ctx.req.headers.authorization?.split(' ')[1];

  if (!jwt_token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      cause: 'No jwt token provided in authorization header',
    });
  }

  try {
    const decoded = <JWTUser>jwt.verify(jwt_token, config.jwt_secret);

    const context: JWTUser = {
      alias: decoded.alias,
      permissions: mapPermissions(decoded.permissions),
    };

    return next({ ctx: context });
  } catch (e) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      cause: 'Invalid jwt token',
    });
  }
});

export function perms(...perms: (keyof JWTPermissions)[]) {
  return ({ ctx, next }: any) => {
    for (const perm of perms) {
      if (!ctx.permissions[perm]) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          cause: 'Permission denied',
        });
      }
    }

    return next({ ctx });
  };
}
