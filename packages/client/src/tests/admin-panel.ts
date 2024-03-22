/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-constant-condition */
import { HexString } from '@ofleps/utils';
import { Client } from '../lib.js';

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

(async () => {
  const admin = new Client('http://localhost:8080');

  await admin.signin('artegoser', 'fynjy2020');

  while (true) {
    eval(
      `(async () => { console.log(await admin.root${await rl.question('> ')}) })()`
    );
  }
})();
