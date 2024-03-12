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
import { db, config } from "../../config/app.service.js";
import { ForbiddenError } from "../../errors/main.js";
import { txTransfer } from "../helpers/txTrans.js";
import NP from "number-precision";
import EventEmitter from "events";
import { MatchResult, genComment, orderMatch } from "../helpers/orderMatch.js";

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

export async function getOrderBook(
  fromCurrencySymbol: string,
  toCurrencySymbol: string,
  page: number
) {
  const [bids, asks] = await db.$transaction([
    db.order.findMany({
      where: {
        fromCurrencySymbol,
        toCurrencySymbol,
        type: true,
      },
      select: {
        price: true,
        quantity: true,
        date: true,
      },
      orderBy: [{ price: "desc" }, { date: "asc" }],
      skip: (page - 1) * 50,
      take: 50,
    }),
    db.order.findMany({
      where: {
        fromCurrencySymbol,
        toCurrencySymbol,
        type: false,
      },
      select: {
        price: true,
        quantity: true,
        date: true,
      },
      orderBy: [{ price: "asc" }, { date: "asc" }],
      skip: (page - 1) * 50,
      take: 50,
    }),
  ]);

  return { bids, asks };
}

export async function cancelOrder(
  orderToCancelId: string,
  signature: HexString
) {
  return await db.$transaction(async (tx) => {
    const order = await tx.order.delete({
      where: {
        id: orderToCancelId,
      },
      include: {
        returnAccount: true,
      },
    });

    if (
      !ec.verify(
        signature,
        { orderToCancelId },
        order.returnAccount.userPk as HexString
      )
    ) {
      throw new ForbiddenError("Invalid signature");
    }

    if (!order) {
      throw new ForbiddenError(`Order with id ${orderToCancelId} not found`);
    }

    await txTransfer(tx, {
      from:
        config.exchange_account_prefix +
        (order.type ? order.toCurrencySymbol : order.fromCurrencySymbol),
      to: order.returnAccountId,
      amount: order.type
        ? NP.times(order.quantity, order.price)
        : order.quantity,
      comment: genComment({
        type: "cancel",
        orderId: order.id,
        pair: order.fromCurrencySymbol + "/" + order.toCurrencySymbol,
        price: order.price,
        quantity: order.quantity,
      }),
    });
  });
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

  const exchange_account_id_from =
    config.exchange_account_prefix + fromCurrencySymbol;
  const exchange_account_id_to =
    config.exchange_account_prefix + toCurrencySymbol;

  const realAmount = type ? NP.times(quantity, price) : quantity;
  // const antiRealAmount = !type ? NP.times(quantity, price) : quantity;

  return await db.$transaction(async (tx) => {
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

    await txTransfer(tx, {
      amount: realAmount,
      from: type ? toAccountId : fromAccountId,
      to: type ? exchange_account_id_to : exchange_account_id_from,
      comment: genComment({
        type: type ? "buy" : "sell",
        orderId: new_order.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity,
      }),
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
