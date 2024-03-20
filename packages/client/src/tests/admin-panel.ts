/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-constant-condition */
import { HexString } from '@ofleps/utils';
import { Root } from '../lib.js';

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

(async () => {
  const admin = new Root(
    'http://localhost:3000',
    'ac601a987ab9a5fcfa076190f4a0643be1ac53842f05f65047240dc8b679f452' as HexString
  );

  while (true) {
    eval(
      `(async () => { console.log(await admin.${await rl.question('> ')}) })()`
    );
  }
})();
