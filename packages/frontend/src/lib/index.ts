// place files you want to import through the `$lib` alias in this folder.
export function dateToUtc(date: string) {
  return new Date(date).getTime() / 1000;
}

export interface Order {
  price: number;
  quantity: number;
  date: string;
}

export interface Options {
  title: string;
  value: string;
}
