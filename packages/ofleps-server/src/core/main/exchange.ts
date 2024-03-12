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

import { HexString, ec } from "ofleps-utils";
import { db } from "../../config/app.service.js";
import { ForbiddenError } from "../../errors/main.js";
import { txTransfer } from "../helpers/txTrans.js";
import NP from "number-precision";
import EventEmitter from "events";
import { MatchResult, orderMatch } from "../helpers/orderMatch.js";

const orderEmitter = new EventEmitter();

orderEmitter.on("new_order", async (data) => {
  let result: MatchResult | undefined;

  while (result?.type !== "all_matched") {
    await db.$transaction(async (tx) => {
      result = await orderMatch(
        tx,
        data.fromCurrencySymbol,
        data.toCurrencySymbol
      );
    });
  }
});

function genComment(obj: any) {
  return `@ofleps_exchange${JSON.stringify(obj)}`;
}

async function createOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,
  price: number,
  type: boolean, // true - buy, false - sell
  signature: HexString
) {
  if (quantity <= 0) throw new ForbiddenError("Set quantity <= 0");

  const account = await db.account.findUniqueOrThrow({
    where: {
      id: type ? toAccountId : fromAccountId,
    },
  });

  if (
    (type ? toCurrencySymbol : fromCurrencySymbol) !== account.currencySymbol
  ) {
    throw new ForbiddenError("Buy/sell with wrong currency");
  }

  if (
    !ec.verify(
      signature,
      {
        fromAccountId,
        toAccountId,
        fromCurrencySymbol,
        toCurrencySymbol,
        quantity,
        price,
        type,
      },
      account.userPk as HexString
    )
  ) {
    throw new ForbiddenError("Invalid signature");
  }

  const exchange_account_id_from = "ofleps_exchange_" + fromCurrencySymbol;
  const exchange_account_id_to = "ofleps_exchange_" + toCurrencySymbol;

  const realAmount = type ? NP.times(quantity, price) : quantity;
  // const antiRealAmount = !type ? NP.times(quantity, price) : quantity;

  return await db.$transaction(async (tx) => {
    await txTransfer(tx, {
      amount: realAmount,
      from: type ? toAccountId : fromAccountId,
      to: type ? exchange_account_id_to : exchange_account_id_from,
      comment: genComment({
        type: type ? "buy" : "sell",
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity,
      }),
    });

    const new_order = await tx.order.create({
      data: {
        accountId: !type ? toAccountId : fromAccountId,
        returnAccountId: type ? toAccountId : fromAccountId,
        quantity,
        price,
        type,

        fromCurrencySymbol,
        toCurrencySymbol,
      },
    });

    orderEmitter.emit("new_order", { fromCurrencySymbol, toCurrencySymbol });

    return new_order;
  });
}

export function makeBuyOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,
  price: number,
  signature: HexString
) {
  return createOrder(
    fromAccountId,
    toAccountId,
    fromCurrencySymbol,
    toCurrencySymbol,
    quantity,
    price,
    true,
    signature
  );
}

export function makeSellOrder(
  fromAccountId: string,
  toAccountId: string,
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  quantity: number,
  price: number,
  signature: HexString
) {
  return createOrder(
    fromAccountId,
    toAccountId,
    fromCurrencySymbol,
    toCurrencySymbol,
    quantity,
    price,
    false,
    signature
  );
}
