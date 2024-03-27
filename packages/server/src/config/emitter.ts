import EventEmitter from 'events';

import TypedEventEmitter, { EventMap } from 'typed-emitter';
type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

import { observable } from '@trpc/server/observable';
import { Prisma } from '@prisma/client';

export interface OrderBookData {
  price: number;
  quantity: number;
  type: 'buy' | 'sell' | 'cancel';
}

export type TransactionData = Prisma.TransactionUncheckedCreateInput;

export type EventsTypes = OrderBookData | TransactionData;

export type Events = {
  [key: `book ${string}/${string}`]: (data: OrderBookData) => void;
  [key: `transaction ${string}`]: (data: TransactionData) => void;
};

export const emitter = new EventEmitter() as TypedEmitter<Events>;

export function onEmitter(event: keyof Events) {
  return observable((emit: any) => {
    emitter.on(event, (data: EventsTypes) => emit.next(data));
  });
}
