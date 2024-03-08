import { HexString } from "ofleps-utils";
import Client from "./lib.js";

(async () => {
  try {
    const sender = new Client("http://localhost:3000");
    const recipient = new Client("http://localhost:3000");

    // await sender.registerUser("sender", "sender@ofleps.io");
    // await recipient.registerUser("recipient", "recipient@ofleps.io");

    // const { id: senderId } = await sender.createAccount(
    //   "sender",
    //   "sender account",
    //   "USD"
    // );

    // const { id: recipientId } = await recipient.createAccount(
    //   "recipient",
    //   "recipient account",
    //   "USD"
    // );

    // console.log("sender:", sender.privateKey, sender.userId);
    // console.log("recipient:", recipient.privateKey, recipient.userId);

    // in db i added 1000 USD to sender
    // TODO: add admin functions

    await sender.login(
      "clthp1u6i0006pmy7ya9grlql",
      "c7cf44a745b5d7dbcaf4ea6da63ca75c6ab16e21bb054b2899ac041af189cea2" as HexString
    );
    await recipient.login(
      "clthp1u710007pmy78mjc63uc",
      "986275dcefb5f2c5e38db10d0f37020f8ee0e10718d5489a17c2bc78e29946c5" as HexString
    );

    const result = await sender.transfer(
      "clthp1u7n0009pmy7j8u67u9v",
      "clthp1u83000bpmy7ik7qo3b4",
      10.5,
      "Hello World"
    );

    console.log("result1\n", result);

    const result2 = await recipient.transfer(
      "clthp1u83000bpmy7ik7qo3b4",
      "clthp1u7n0009pmy7j8u67u9v",
      10.5,
      "No, thank you"
    );

    console.log("result2\n", result2);
  } catch (e: any) {
    console.log(e.message);
  }
})();
