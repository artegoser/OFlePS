import Client from "../lib";

const ofleps = Client("http://localhost:3000");

(async () => {
  console.log(await ofleps.transactions.query());
})();
