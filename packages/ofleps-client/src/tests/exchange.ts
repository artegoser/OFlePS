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

import { HexString } from "ofleps-utils";
import { Client, Root } from "../lib.js";

(async () => {
  const admin = new Root(
    "http://localhost:3000",
    "ac601a987ab9a5fcfa076190f4a0643be1ac53842f05f65047240dc8b679f452" as HexString
  );

  // await admin.addCurrency("USD", "United States Dollar", "Currency of the US");
  // await admin.addCurrency(
  //   "RUB",
  //   "Russian ruble",
  //   "Currency of Russian Federation"
  // );

  const sender = new Client("http://localhost:3000");
  const recipient = new Client("http://localhost:3000");

  await sender.registerUser("sender", "sender@ofleps.io");
  await recipient.registerUser("recipient", "recipient@ofleps.io");

  const { id: senderFromId } = await sender.createAccount(
    "sender usd",
    "sender account",
    "USD"
  );

  const { id: senderToId } = await sender.createAccount(
    "sender rub",
    "sender account",
    "RUB"
  );

  const { id: recipientFromId } = await recipient.createAccount(
    "recipient usd",
    "recipient account",
    "USD"
  );

  const { id: recipientToId } = await recipient.createAccount(
    "recipient rub",
    "recipient account",
    "RUB"
  );

  //now admin issues money
  await admin.issue(senderFromId, 5, "issue usd to sender");
  await admin.issue(recipientToId, 500, "issue rub to sender");

  //now sender transfers money to recipient
  const order1 = await sender.sell(
    senderFromId,
    senderToId,
    "USD",
    "RUB",
    1,
    90
  );

  console.log(order1);

  const order2 = await recipient.buy(
    recipientFromId,
    recipientToId,
    "USD",
    "RUB",
    1,
    90
  );

  console.log(order2);
})();
