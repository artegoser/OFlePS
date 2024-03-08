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

import ivm from "isolated-vm";
import { db } from "../config/app.service.js";

export async function execute(
  code: string,
  data: string,
  smartContractId: string
) {
  const isolate = new ivm.Isolate({
    memoryLimit: 8,
  });

  const context = isolate.createContextSync();

  const jail = context.global;

  jail.setSync("global", jail.derefInto());
  jail.setSync("data", data);

  jail.setSync(
    "storageSet",
    new ivm.Callback(
      async (key: string, value: string) => {
        const res = await db.smartContractMemory.upsert({
          update: {
            value,
          },
          create: {
            smartContractId,
            key,
            value,
          },
          where: {
            smartContractId,
            key,
          },
        });

        console.log(res);

        return res;
      },
      { async: true }
    )
  );

  jail.setSync(
    "storageGet",
    new ivm.Callback(
      async (key: string) => {
        const memory = await db.smartContractMemory.findFirst({
          where: {
            smartContractId,
            key,
          },
        });
        console.log(memory);
        return memory ? memory.value : null;
      },
      { async: true }
    )
  );

  const script = isolate.compileScriptSync(`(async () => { ${code} })()`);
  console.log(script);
  return await script.run(context);
}
