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

  await admin.addCurrency("USD", "United States Dollar", "Currency of the US");

  const sender = new Client("http://localhost:3000");
  const recipient = new Client("http://localhost:3000");

  await sender.registerUser("sender", "sender@ofleps.io");
  await recipient.registerUser("recipient", "recipient@ofleps.io");

  const { id: senderId } = await sender.createAccount(
    "sender",
    "sender account",
    "USD"
  );

  //now admin issues money to sender
  await admin.issue(senderId, 100, "issue money to sender");

  const { id: recipientId } = await recipient.createAccount(
    "recipient",
    "recipient account",
    "USD"
  );

  //now sender transfers money to recipient
  const transaction1 = await sender.transfer({
    from: senderId,
    to: recipientId,
    amount: 42.42,
    comment: "Give me the answer to life, the universe, and everything",
  });

  console.log(transaction1);

  //now recipient transfers money to sender
  const transaction2 = await recipient.transfer({
    from: recipientId,
    to: senderId,
    amount: 0.42,
    comment: "I don't know",
  });

  console.log(transaction2);
})();
