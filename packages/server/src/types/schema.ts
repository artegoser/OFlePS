import { z } from 'zod';

function alphaNumeric(s: string) {
  return /^[a-zA-Z0-9_]*$/.test(s);
}

function uppercase(s: string) {
  return s === s.toLocaleUpperCase();
}

function lowercase(s: string) {
  return s === s.toLocaleLowerCase();
}

export const name = z.string().min(1).max(32).trim();

export const alias = z
  .string()
  .min(3)
  .max(32)
  .refine(
    (s) => alphaNumeric(s) && lowercase(s),
    'Must be alphanumeric and lowercase'
  );

export const account_id = z
  .string()
  .min(7) // 3(min user alias) + 1(_) + 3(min account alias)
  .max(65) // 32(max user alias) + 1(_) + 32(max account alias)
  .refine(
    (s) => alphaNumeric(s) && lowercase(s),
    'Must be alphanumeric and lowercase'
  );

export const code = z.string().min(1).max(1024);

export const description = z.string().min(1).max(256).trim();

export const comment = z.string().min(1).max(256).trim();

export const method = z
  .string()
  .trim()
  .refine((s) => alphaNumeric(s), 'Must be alphanumeric');

export const params = z.array(z.string().or(z.number()).or(z.boolean()));

export const currencySymbol = z
  .string()
  .min(3)
  .max(6)
  .refine(
    (s) => alphaNumeric(s) && uppercase(s),
    'Must be alphanumeric and uppercase'
  );

export const email = z.string().email();

export const page = z.number().int().min(1);

export const granularity = z.string().min(2).max(4);

export const amount = z.number().refine((s) => s > 0, 'Amount must be > 0');
export const password = z.string().min(8).max(32);
