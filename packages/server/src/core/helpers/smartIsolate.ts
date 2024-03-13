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

import ivm from 'isolated-vm';
import { db } from '../../config/app.service.js';
import {
  ParamTypes,
  SmartContractGlobalMemory,
  SmartRequest,
} from '@ofleps/utils';

interface PostSmartContractTask {
  method: 'gs_set';
  params: ParamTypes[];
}

export class SmartIsolate {
  private _smartContractId: string;
  private _authorId: string;
  private _tasks: PostSmartContractTask[] = [];
  constructor(smartContractId: string, authorId: string) {
    this._smartContractId = smartContractId;
    this._authorId = authorId;
  }

  private _gs_set(key: string, value: string | number | boolean) {
    this._tasks.push({ method: 'gs_set', params: [key, value] });
  }

  async execute(
    code: string,
    request: SmartRequest,
    globalMemory: SmartContractGlobalMemory
  ) {
    const isolate = new ivm.Isolate({
      memoryLimit: 8,
    });

    const context = isolate.createContextSync();

    const jail = context.global;

    jail.setSync('global', jail.derefInto());
    jail.setSync('__request', new ivm.ExternalCopy(request).copyInto());
    jail.setSync('__return', undefined);
    jail.setSync('gMem', new ivm.ExternalCopy(globalMemory).copyInto());
    jail.setSync('__owner', this._authorId);
    jail.setSync(
      'gs_set',
      new ivm.Callback((key: string, value: ParamTypes) => {
        this._gs_set(key, value);
      })
    );

    context.evalSync(code);
    context.evalSync('const contract = new Contract(__owner)');

    const script = isolate.compileScriptSync(
      `__return = contract.${request.method}(...__request.params)`
    );

    script.runSync(context, { release: true, timeout: 1000 });

    const postExec = new TaskExecutor(this._tasks, this._smartContractId);

    await postExec.execute();

    return jail.getSync('__return');
  }
}

class TaskExecutor {
  private _tasks: PostSmartContractTask[] = [];
  private _smartContractId: string;
  constructor(tasks: PostSmartContractTask[], smartContractId: string) {
    this._tasks = tasks;
    this._smartContractId = smartContractId;
  }

  public async execute() {
    for (const task of this._tasks) {
      switch (task.method) {
        case 'gs_set': {
          await this._gs_set(task.params[0].toString(), task.params[1]);
          break;
        }
      }
    }
  }

  private async _gs_set(key: string, value: string | number | boolean) {
    await db.$transaction(async (tx) => {
      const memory = await tx.smartContractGlobalMemory.findUnique({
        where: {
          smartContractId: this._smartContractId,
        },
      });

      if (!memory) {
        return await tx.smartContractGlobalMemory.create({
          data: {
            smartContractId: this._smartContractId,
            value: JSON.stringify({ [key]: value }),
          },
        });
      }

      const memVal = JSON.parse(memory.value);

      memVal[key] = value;

      return await tx.smartContractGlobalMemory.update({
        where: {
          smartContractId: this._smartContractId,
        },
        data: {
          value: JSON.stringify(memVal),
        },
      });
    });
  }
}
