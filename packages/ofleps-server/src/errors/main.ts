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

import { TRPCError } from '@trpc/server';

type ErrorCodes =
  | 'INTERNAL_SERVER_ERROR'
  | 'PARSE_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_IMPLEMENTED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST';

export abstract class OflepsError extends TRPCError {
  code: ErrorCodes;
  name: string;
  message: string;

  constructor(code: ErrorCodes, name: string, message: string) {
    super({ code, message });
    this.code = code;
    this.name = name;
    this.message = message;
  }
}

export class ForbiddenError extends OflepsError {
  constructor(message: string) {
    super('FORBIDDEN', 'Forbidden', `Forbidden: ${message}`);
  }
}

export class NotFoundError extends OflepsError {
  constructor(message: string) {
    super(
      'NOT_FOUND',
      'Not found',
      `The requested resource was not found: ${message}`
    );
  }
}

export class BadRequestError extends OflepsError {
  constructor(description: string) {
    super('BAD_REQUEST', 'Bad request', description);
  }
}
