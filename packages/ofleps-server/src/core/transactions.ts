import { db } from "../config/app.service.js";
import { BadRequestError } from "../errors/main.js";
import { checkFromTo } from "./utils.js";

export function getTransactions(from: number, to: number) {
  checkFromTo(from, to);

  return db.transaction.findMany({
    skip: from,
    take: to - from,
  });
}
