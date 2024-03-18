import { Client } from '@ofleps/client';
import { env } from '$env/dynamic/public';

export const serverClient = new Client(
  env.PUBLIC_OFLEPS_URL || 'http://localhost:3000'
);
