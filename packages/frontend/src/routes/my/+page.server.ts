import { serverClient } from '$lib/server.js';
import type { HexString } from '@ofleps/utils';

export async function load({ cookies }) {
  const user = await serverClient.getUserByPublicKey(
    (cookies.get('userPk') || 'none') as HexString
  );

  return {
    user,
  };
}
