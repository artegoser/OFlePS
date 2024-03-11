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

function genComment(obj: any) {
  return `@ofleps${JSON.stringify(obj)}`;
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

  const { id: exchange_account_id_from } = await db.account.findUniqueOrThrow({
    where: {
      id: "ofleps_exchange_" + fromCurrencySymbol,
    },
  });

  const { id: exchange_account_id_to } = await db.account.findUniqueOrThrow({
    where: {
      id: "ofleps_exchange_" + toCurrencySymbol,
    },
  });

  const realAmount = type ? NP.times(quantity, price) : quantity;

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

    const order = await tx.order.findFirst({
      where: {
        quantity,
        price,
        type: !type,
      },
    });

    if (order) {
      await tx.order.delete({
        where: {
          id: order.id,
        },
      });

      await txTransfer(tx, {
        amount: realAmount,
        from: type ? exchange_account_id_to : exchange_account_id_from,
        to: order.accountId,
        comment: genComment({
          type: (!type ? "buy" : "sell") + " success",
          pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
          price,
          quantity: realAmount,
        }),
      });

      const transaction = await txTransfer(tx, {
        amount: quantity,
        from: !type ? exchange_account_id_to : exchange_account_id_from,
        to: !type ? toAccountId : fromAccountId,
        comment: genComment({
          type: (type ? "buy" : "sell") + " success",
          pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
          price,
          quantity,
        }),
      });

      await tx.completeOrder.create({
        data: {
          price,
          fromCurrencySymbol,
          toCurrencySymbol,
        },
      });

      return transaction;
    }

    return await tx.order.create({
      data: {
        accountId: type ? fromAccountId : toAccountId,
        quantity,
        price,
        type,

        fromCurrencySymbol,
        toCurrencySymbol,
      },
    });
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
