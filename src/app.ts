import { IConfigService } from "./config/config.interface";
import { ConfigService } from "./config/config.service";
import { PrismaClient } from "@prisma/client";

class App {
  config: IConfigService;
  prisma: PrismaClient;
  constructor() {
    this.config = new ConfigService();
    this.prisma = new PrismaClient();
  }
  init() {}
}

const app = new App();
app.init();
