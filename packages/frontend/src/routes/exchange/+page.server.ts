import { serverClient } from '$lib/server';
import type { HexString } from '@ofleps/utils';

export async function load({ cookies }) {
  const accounts = await serverClient.getAccountsByUserPk(
    (cookies.get('userPk') || 'none') as HexString
  );

  const granularities = await serverClient.getGranularities();

  return {
    accounts,
    granularities,
  };
}
