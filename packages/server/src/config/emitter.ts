import EventEmitter from 'events';

import TypedEventEmitter, { EventMap } from 'typed-emitter';
type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

import { observable } from '@trpc/server/observable';

type Events = {
  [key: `book ${string}/${string}`]: ({
    price,
    quantity,
    type,
  }: {
    price: number;
    quantity: number;
    type: 'buy' | 'sell' | 'cancel';
  }) => void;
};

export const emitter = new EventEmitter() as TypedEmitter<Events>;

export function onEmitter(event: keyof Events) {
  return observable((emit: any) => {
    emitter.on(event, (data) => emit.next(data));
  });
}
