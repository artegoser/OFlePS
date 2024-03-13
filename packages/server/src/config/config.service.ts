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

import { config } from 'dotenv';
import { HexString, ec, parseGranularity } from 'ofleps-utils';

export class ConfigService {
  public readonly db_url: string;
  public readonly host: string;
  public readonly port: number;
  public readonly root_public_key: HexString;
  public readonly server_private_key: HexString;
  public readonly server_public_key: HexString;
  public readonly auto_approve: boolean;
  public readonly currencies: string[];
  public readonly exchange_account_prefix: string;
  public readonly granularities;

  constructor() {
    config();

    this.db_url = process.env.DATABASE_URL || 'file:./dev.db';
    this.host = process.env.HOST || '0.0.0.0';
    this.port = Number(process.env.PORT) || 8080;

    if (process.env.ROOT_PUBLIC_KEY === undefined) {
      throw new Error('ROOT_PUBLIC_KEY is not defined, please set it');
    }

    this.root_public_key = process.env.ROOT_PUBLIC_KEY as HexString;

    if (process.env.SERVER_PRIVATE_KEY === undefined) {
      throw new Error('SERVER_PRIVATE_KEY is not defined, please set it');
    }

    this.server_private_key = process.env.SERVER_PRIVATE_KEY as HexString;
    this.server_public_key = ec.getPublicKey(this.server_private_key);

    this.auto_approve = parseBool(process.env.AUTO_APPROVE, true);

    this.currencies = process.env.CURRENCIES?.split(',') || [];
    this.granularities = (process.env.GRANULARITIES?.split(',') || []).map(
      (granularity) => parseGranularity(granularity)
    );

    this.exchange_account_prefix =
      process.env.EXCHANGE_ACCOUNT_PREFIX || 'exchange_';
  }
}

function parseBool(value: string | undefined, def: boolean): boolean {
  if (!value) return def;
  return value === 'true' || value === '1';
}
