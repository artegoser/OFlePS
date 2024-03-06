import Client from "./lib";

const ofleps = new Client("http://localhost:3000");

(async () => {
  console.log(await ofleps.transactions(0, 10));
})();
