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

import { ConfigService } from "./config.service";
import { PrismaClient } from "@prisma/client";

class App {
  config: ConfigService;
  prisma: PrismaClient;
  constructor() {
    this.config = new ConfigService();
    this.prisma = new PrismaClient();
  }
}

const app = new App();
export default app;
