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

import { config } from "dotenv";

export class ConfigService {
  public readonly db_url: string;
  public readonly host: string;
  public readonly port: number;

  constructor() {
    config();

    this.db_url = process.env.DATABASE_URL || "file:./dev.db";
    this.host = process.env.HOST || "0.0.0.0";
    this.port = Number(process.env.PORT) || 8080;
  }
}