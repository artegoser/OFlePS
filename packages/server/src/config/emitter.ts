import EventEmitter from 'events';

import TypedEventEmitter, { EventMap } from 'typed-emitter';
type TypedEmitter<T extends EventMap> = TypedEventEmitter.default<T>;

type Events = {
  new_order: (
    fromCurrencySymbol: string,
    toCurrencySymbol: string,
    price: number,
    quantity: number,
    type: boolean
  ) => void;
};

export const emitter = new EventEmitter() as TypedEmitter<Events>;
