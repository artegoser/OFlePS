import { ConfigService } from "./config/config.service";
import { PrismaClient } from "@prisma/client";

class App {
  config: ConfigService;
  prisma: PrismaClient;
  constructor() {
    this.config = new ConfigService();
    this.prisma = new PrismaClient();
  }
  init() {}
}

const app = new App();
app.init();
