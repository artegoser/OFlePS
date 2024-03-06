import { db } from "../config/app.service.js";
import { BadRequestError } from "../errors/main.js";

export function getTransactions(from: number, to: number) {
  if (from < 0 || to < 0) throw new BadRequestError("from and to must be > 0");
  if (from > to) throw new BadRequestError("from must be <= to");
  if (to - from > 50) throw new BadRequestError("from and to must be <= 50");

  return db.transaction.findMany({
    skip: from,
    take: to - from,
  });
}
