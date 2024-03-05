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
