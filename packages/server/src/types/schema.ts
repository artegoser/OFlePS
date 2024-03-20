import { z } from 'zod';

function noSpaces(s: string) {
  return !s.includes(' ');
}

function noUppercase(s: string) {
  return !uppercase(s);
}

function uppercase(s: string) {
  return /[A-Z]/.test(s);
}

export const name = z.string().min(1).max(32).trim();

export const alias = z
  .string()
  .min(3)
  .max(32)
  .refine(
    (s) => noSpaces(s) && noUppercase(s),
    'No spaces/uppercase in alias allowed'
  );

export const account_id = z
  .string()
  .min(34)
  .max(65)
  .refine(
    (s) => noSpaces(s) && noUppercase(s),
    'No spaces/uppercase in account_id allowed'
  );

export const code = z.string().min(1).max(1024);

export const description = z.string().min(1).max(256).trim();

export const comment = z.string().min(1).max(256).trim();

export const method = z
  .string()
  .trim()
  .refine((s) => noSpaces(s), 'No spaces in method name allowed');

export const params = z.array(z.string().or(z.number()).or(z.boolean()));

export const currencySymbol = z
  .string()
  .min(3)
  .max(6)
  .refine(
    (s) => noSpaces(s) && uppercase(s),
    'No spaces/lowercase in symbol allowed'
  );

export const email = z.string().email();

export const page = z.number().int().min(1);

export const granularity = z.string().min(2).max(4);

export const amount = z.number().refine((s) => s > 0);
export const password = z.string().min(8).max(32);
