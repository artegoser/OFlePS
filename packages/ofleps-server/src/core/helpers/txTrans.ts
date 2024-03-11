import { PrismaClient } from "@prisma/client/extension";
import { HexString, ec } from "ofleps-utils";
import { ForbiddenError } from "../../errors/main.js";

export interface TransactionReq {
  from: string;
  to: string;
  amount: number;
  signature: HexString;
  comment?: string;
  salt: string;
}

export async function txTransaction(tx: PrismaClient, req: TransactionReq) {
  const { from, to, amount, signature, comment, salt } = req;

  const senderAccount = await tx.account.update({
    data: {
      balance: {
        decrement: amount,
      },
    },
    include: {
      User: true,
    },
    where: {
      id: from,
    },
  });

  if (senderAccount.blocked) {
    throw new ForbiddenError("Sender account is blocked");
  }

  if (senderAccount.balance < 0) {
    throw new ForbiddenError("transfer more amount than your balance");
  }

  if (!senderAccount.User.approved) {
    throw new ForbiddenError("Sender account's user is not approved");
  }

  if (senderAccount.User.blocked) {
    throw new ForbiddenError("Sender account's user is blocked");
  }

  if (
    !ec.verify(
      signature,
      { from, to, amount, comment, salt, type: "transfer" },
      senderAccount.userPk as HexString
    )
  ) {
    throw new ForbiddenError(
      "Invalid signature (Maybe you're sending not from your account)"
    );
  }

  const recipientAccount = await tx.account.update({
    data: {
      balance: {
        increment: amount,
      },
    },
    include: {
      User: true,
    },
    where: {
      id: to,
    },
  });

  if (senderAccount.currencySymbol !== recipientAccount.currencySymbol) {
    throw new ForbiddenError(
      "Cannot perform transaction between different currencies"
    );
  }

  if (recipientAccount.blocked) {
    throw new ForbiddenError("Recipient account is blocked");
  }

  if (!recipientAccount.User.approved) {
    throw new ForbiddenError("Recipient account's user is not approved");
  }

  if (recipientAccount.User.blocked) {
    throw new ForbiddenError("Recipient account's user is blocked");
  }

  const transaction = await tx.transaction.create({
    data: {
      amount,
      type: "transfer",
      from,
      to,
      comment,
      signature,
      salt,
    },
  });

  return transaction;
}
