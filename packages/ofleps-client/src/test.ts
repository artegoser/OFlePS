import Client from "./lib.js";

const ofleps = new Client("http://localhost:3000");

(async () => {
  ofleps.generateKeyPair();

  console.log({
    privateKey: ofleps.privateKey,
    publicKey: ofleps.publicKey,
  });

  const resp = await ofleps.registerUser("test", "test@gmail.com");

  console.log(resp);
})();
