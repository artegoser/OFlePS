import { HexString } from "ofleps-utils";
import { Client, Root } from "../lib.js";

(async () => {
  const user = new Client("http://localhost:3000");

  await user.registerUser("sender", "sender@ofleps.io");

  const smartContract = await user.createSmartContract(
    "Test sc",
    "Set requested data",
    `
      const parsed = JSON.parse(data);

      await storageSet("key", parsed.value);
    `
  );

  const result = await user.executeSmartContract(
    smartContract.id,
    `{"value":"hello world"}`
  );
})();
