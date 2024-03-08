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

import { HexString, ec } from "ofleps-utils";
import { db, config } from "../config/app.service.js";
import { ForbiddenError, NotFoundError } from "../errors/main.js";
import { execute } from "./smartIsolate.js";

export async function executeSmartContract(
  smartContractId: string,
  reqData: string,
  callerId: string,
  signature: HexString
) {
  const caller = await db.user.findUnique({ where: { id: callerId } });

  if (!caller) {
    throw new NotFoundError(`User with id "${callerId}" not found`);
  }

  if (
    !ec.verify(
      signature,
      { smartContractId, reqData, callerId },
      caller.publicKey as HexString
    )
  ) {
    throw new ForbiddenError("Invalid signature");
  }

  const smartContract = await db.smartContract.findUnique({
    where: { id: smartContractId },
  });

  if (!smartContract) {
    throw new NotFoundError(
      `Smart contract with id "${smartContractId}" not found`
    );
  }

  return await execute(smartContract.code, reqData, smartContractId);
}

export async function createSmartContract(
  name: string,
  description: string,
  code: string,
  authorId: string,
  signature: HexString
) {
  const author = await db.user.findUnique({ where: { id: authorId } });

  if (!author) {
    throw new NotFoundError(`User with id "${authorId}" not found`);
  }

  if (
    !ec.verify(
      signature,
      { name, description, code, authorId },
      author.publicKey as HexString
    )
  ) {
    throw new ForbiddenError("Invalid signature");
  }

  const smartContract = await db.smartContract.create({
    data: {
      name,
      description,
      code,
      authorId,
      signature,
    },
  });

  return smartContract;
}
