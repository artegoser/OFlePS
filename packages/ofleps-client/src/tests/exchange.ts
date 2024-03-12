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

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

(async () => {
  const admin = new Root(
    "http://localhost:3000",
    "ac601a987ab9a5fcfa076190f4a0643be1ac53842f05f65047240dc8b679f452" as HexString
  );

  const alice = new Client("http://localhost:3000");
  const bob = new Client("http://localhost:3000");

  await alice.registerUser("sender", "sender@ofleps.io");
  await bob.registerUser("recipient", "recipient@ofleps.io");

  const { id: afid } = await alice.createAccount(
    "sender usd",
    "sender account",
    "USD"
  );

  const { id: atid } = await alice.createAccount(
    "sender rub",
    "sender account",
    "RUB"
  );

  const { id: bfid } = await bob.createAccount(
    "recipient usd",
    "recipient account",
    "USD"
  );

  const { id: btid } = await bob.createAccount(
    "recipient rub",
    "recipient account",
    "RUB"
  );

  //now admin issues money
  await admin.issue(afid, 5, "issue usd to sender");
  await admin.issue(btid, 500, "issue rub to recipient");

  // Place multiple limit orders
  await alice.sell(afid, atid, "USD", "RUB", 1, 90);
  await alice.sell(afid, atid, "USD", "RUB", 1, 95);
  await alice.sell(afid, atid, "USD", "RUB", 2, 99);
  await alice.sell(afid, atid, "USD", "RUB", 1, 110);

  // Place limit order
  // Buys 3 USD for 90,95,99
  await bob.buy(bfid, btid, "USD", "RUB", 3, 100);

  // Wait some time for exchange to settle
  await wait(1000);

  // Order fullfiled(probably), now we can see transactions
  const transactions_alice = await alice.getTransactions(atid);
  const transactions_bob = await bob.getTransactions(bfid);

  console.log(`\nSender transactions (${atid}):`);
  console.log(
    transactions_alice
      .map(
        (t) =>
          `sender: ${t.amount} ${t.currencySymbol} ${
            atid === t.from ? "->" : "<-"
          } ${t.type}`
      )
      .join("\n")
  );

  console.log(`\nRecipient transactions (${bfid}):`);

  console.log(
    transactions_bob
      .map(
        (t) =>
          `recipient: ${t.amount} ${t.currencySymbol} ${
            bfid === t.from ? "->" : "<-"
          } ${t.type}`
      )
      .join("\n")
  );
})();
