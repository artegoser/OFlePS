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

import Client from "./lib.js";

const ofleps = new Client(
  "http://localhost:3000",
  "ac99ac0f07411a00e64933862a3e6dbaf2ace951034a11fa3382c85bf3753742"
);

(async () => {
  console.log({
    privateKey: ofleps.privateKey,
    publicKey: ofleps.publicKey,
  });

  const resp = await ofleps.createUser("test", "test");

  console.log(resp);
})();
