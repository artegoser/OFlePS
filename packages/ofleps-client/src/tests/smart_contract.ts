import { HexString } from "ofleps-utils";
import { Client, Root } from "../lib.js";

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
