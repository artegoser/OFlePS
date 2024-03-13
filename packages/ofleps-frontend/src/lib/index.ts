// place files you want to import through the `$lib` alias in this folder.
export function dateToUtc(date: string) {
  return new Date(date).getTime() / 1000;
}
