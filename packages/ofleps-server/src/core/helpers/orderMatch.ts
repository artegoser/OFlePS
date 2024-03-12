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

import { config, type txDb } from "../../config/app.service.js";
import NP from "number-precision";
import { txTransfer } from "./txTrans.js";

export interface MatchResult {
  type: "all_matched" | "match_success";
}

interface CommentData {
  type: string;
  orderId: string;
  pair: string;
  price: number;
  quantity: number;
}

export function genComment(obj: CommentData) {
  return `@exchange${JSON.stringify(obj)}`;
}

export async function orderMatch(
  tx: txDb,
  fromCurrencySymbol: string,
  toCurrencySymbol: string
): Promise<MatchResult> {
  const highestBuyOrder = await tx.order.findFirst({
    where: { type: true, fromCurrencySymbol, toCurrencySymbol },
    orderBy: [{ price: "desc" }, { date: "asc" }],
  });

  const lowestSellOrder = await tx.order.findFirst({
    where: { type: false, fromCurrencySymbol, toCurrencySymbol },
    orderBy: [{ price: "asc" }, { date: "asc" }],
  });

  if (!highestBuyOrder || !lowestSellOrder) {
    return {
      type: "all_matched",
    };
  }

  if (highestBuyOrder.price >= lowestSellOrder.price) {
    const quantityToTrade = Math.min(
      highestBuyOrder.quantity,
      lowestSellOrder.quantity
    );

    const price = lowestSellOrder.price;

    const sellerAmount = NP.times(quantityToTrade, lowestSellOrder.price);
    const buyerAmount = NP.times(quantityToTrade, highestBuyOrder.price);

    // Update the quantities of the matched orders
    if (highestBuyOrder.quantity > quantityToTrade) {
      await tx.order.update({
        where: { id: highestBuyOrder.id },
        data: { quantity: { decrement: quantityToTrade } },
      });
    } else {
      await tx.order.delete({ where: { id: highestBuyOrder.id } });
    }

    if (lowestSellOrder.quantity > quantityToTrade) {
      await tx.order.update({
        where: { id: lowestSellOrder.id },
        data: { quantity: { decrement: quantityToTrade } },
      });
    } else {
      await tx.order.delete({ where: { id: lowestSellOrder.id } });
    }

    //Perform transactions from exchange accounts
    // Seller gets the money
    await txTransfer(tx, {
      amount: sellerAmount,
      from: config.exchange_account_prefix + toCurrencySymbol,
      to: lowestSellOrder.accountId,
      comment: genComment({
        type: "sell_success",
        orderId: lowestSellOrder.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity: quantityToTrade,
      }),
    });

    // Buyer gets the money
    await txTransfer(tx, {
      amount: quantityToTrade,
      from: config.exchange_account_prefix + fromCurrencySymbol,
      to: highestBuyOrder.accountId,
      comment: genComment({
        type: "buy_success",
        orderId: highestBuyOrder.id,
        pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
        price,
        quantity: quantityToTrade,
      }),
    });

    // Refund unused funds to the buyer
    if (buyerAmount > sellerAmount) {
      await txTransfer(tx, {
        amount: NP.minus(buyerAmount, sellerAmount),
        from: config.exchange_account_prefix + toCurrencySymbol,
        to: highestBuyOrder.returnAccountId,
        comment: genComment({
          type: "refund_unutilized_funds",
          orderId: highestBuyOrder.id,
          pair: `${fromCurrencySymbol}/${toCurrencySymbol}`,
          price,
          quantity: quantityToTrade,
        }),
      });
    }

    await tx.completeOrder.create({
      data: {
        price,
        quantity: quantityToTrade,
        fromCurrencySymbol,
        toCurrencySymbol,
      },
    });

    return { type: "match_success" };
  }

  return { type: "all_matched" };
}
