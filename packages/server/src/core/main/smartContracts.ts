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

import { db } from '../../config/app.service.js';
import { NotFoundError } from '../../errors/main.js';
import { SmartIsolate } from '../helpers/smartIsolate.js';
import { SmartRequest } from '@ofleps/utils';
import { User } from '../../types/auth.js';

export function getSmartContractById(smartContractId: string) {
  return db.smartContract.findUnique({
    where: { id: smartContractId },
  });
}

export async function executeSmartContract(
  smartContractId: string,
  reqData: SmartRequest,
  user: User
) {
  const smartContract = await db.smartContract.findUnique({
    where: { id: smartContractId },
  });

  if (!smartContract) {
    throw new NotFoundError(`Smart contract with id "${smartContractId}"`);
  }

  const globalMemory = await db.smartContractGlobalMemory.findUnique({
    where: { smartContractId },
  });

  if (!globalMemory) {
    throw new NotFoundError(
      `Global memory for smart contract with id "${smartContractId}"`
    );
  }

  const isolate = new SmartIsolate(
    smartContract.id,
    smartContract.authorAlias,
    user.alias
  );

  return await isolate.execute(
    smartContract.code,
    reqData,
    JSON.parse(globalMemory.value)
  );
}

export async function createSmartContract(
  name: string,
  description: string,
  code: string,
  user: User
) {
  const smartContract = await db.$transaction(async (tx) => {
    const sc = await tx.smartContract.create({
      data: {
        name,
        description,
        code,
        authorAlias: user.alias,
      },
    });

    await tx.smartContractGlobalMemory.create({
      data: {
        smartContractId: sc.id,
      },
    });

    return sc;
  });

  return smartContract;
}
