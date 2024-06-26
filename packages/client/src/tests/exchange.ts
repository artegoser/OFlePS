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

import { Client } from '../lib.js';

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
}

function mapOrderBook(orderBook: any) {
  return {
    bids: orderBook.bids.map(
      ({ price, quantity }: { price: number; quantity: number }) =>
        `price: ${price} quantity: ${quantity}`
    ),
    asks: orderBook.asks.map(
      ({ price, quantity }: { price: number; quantity: number }) =>
        `price: ${price} quantity: ${quantity}`
    ),
  };
}

(async () => {
  const admin = new Client('http://localhost:8080');
  await admin.signin('root', 'root_pass');

  const alice = new Client('http://localhost:8080');
  const bob = new Client('http://localhost:8080');

  await alice.registerUser('alice', 'alice_pass', 'alice', 'alice@ofleps.io');
  await bob.registerUser('bob', 'bob_pass', 'bob', 'bob@ofleps.io');

  const { id: afid } = await alice.createAccount(
    'usd',
    'alice usd',
    'alice account',
    'USD'
  );

  const { id: atid } = await alice.createAccount(
    'rub',
    'alice rub',
    'alice account',
    'RUB'
  );

  const { id: bfid } = await bob.createAccount(
    'usd',
    'bob usd',
    'bob account',
    'USD'
  );

  const { id: btid } = await bob.createAccount(
    'rub',
    'bob rub',
    'bob account',
    'RUB'
  );

  //now admin issues money
  await admin.rootIssueToAccountId(afid, 5, 'issue usd to alice');
  await admin.rootIssueToAccountId(btid, 500, 'issue rub to bob');

  // Place multiple limit orders
  await alice.sell(afid, atid, 'USD', 'RUB', 1, 90);
  await alice.sell(afid, atid, 'USD', 'RUB', 1, 95);
  const unfulfilled = await alice.sell(afid, atid, 'USD', 'RUB', 2, 99);
  await alice.sell(afid, atid, 'USD', 'RUB', 1, 110);

  console.log('Order book before buy:');
  console.table(mapOrderBook(await bob.getOrderBook('USD', 'RUB')));

  // Place limit order
  // Buys 3 USD for 90,95,99
  await bob.buy(bfid, btid, 'USD', 'RUB', 3, 100);

  console.log('Order book after buy:');
  console.table(mapOrderBook(await bob.getOrderBook('USD', 'RUB')));

  // Cancel alice sell order
  await alice.cancelOrder(unfulfilled.id);

  console.log('Order book after canceling:');
  console.table(mapOrderBook(await bob.getOrderBook('USD', 'RUB')));

  console.log('Waiting one minute to update trading schedule');
  await wait(1000 * 61);

  console.log('Buying again');
  await bob.buy(bfid, btid, 'USD', 'RUB', 1, 120);

  console.log('Order book after bying all:');
  console.table(mapOrderBook(await bob.getOrderBook('USD', 'RUB')));

  console.log('Trading schedule 1m:');
  console.table(await bob.getTradingSchedule('USD', 'RUB', '1m'));

  // Order fullfiled(probably), now we can see transactions
  const transactions_alice = await alice.getTransactionsByAccountId(atid);
  const transactions_bob = await bob.getTransactionsByAccountId(bfid);

  const aa = await alice.getAccountById(atid);
  const ba = await bob.getAccountById(bfid);

  console.log('\nTransactions after exchange:\n');
  console.log(`\nAlice transactions (${aa?.balance} ${aa?.currencySymbol}):`);
  console.log(
    transactions_alice
      .map(
        (t) =>
          `${t.amount} ${t.currencySymbol} ${atid === t.from ? '->' : '<-'} ${
            t.type
          }`
      )
      .join('\n')
  );

  console.log(`\nBob transactions (${ba?.balance} ${ba?.currencySymbol}):`);

  console.log(
    transactions_bob
      .map(
        (t) =>
          `${t.amount} ${t.currencySymbol} ${bfid === t.from ? '->' : '<-'} ${
            t.type
          }`
      )
      .join('\n')
  );
})();
