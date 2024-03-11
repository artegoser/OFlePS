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

import { Client } from "../lib.js";

(async () => {
  const user = new Client("http://localhost:3000");

  await user.registerUser("sender", "sender@ofleps.io");

  const smartContract = await user.createSmartContract(
    "Test sc",
    "Set requested data",
    `
      class Contract {
        constructor(owner) {
          this.owner = owner;
        }

        setToOwner(data) {
          gs_set(this.owner, data); // this add task to queue for execute post smart contract, not execute immediately

          return \`Setted to \${this.owner} "\${data}"\`;
        }

        getFromOwner() {
          return gMem[this.owner];
        }
      }
    `
  );

  const result = await user.executeSmartContract(smartContract.id, {
    method: "setToOwner",
    params: ["hello world"],
  });

  console.log(result);

  const result2 = await user.executeSmartContract(smartContract.id, {
    method: "getFromOwner",
    params: [],
  });

  console.log(result2);
})();
