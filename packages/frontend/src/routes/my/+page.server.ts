import { serverClient } from '$lib/server.js';

export async function load({ cookies }) {
  const user = await serverClient.getUserByAlias(
    cookies.get('user_alias') || 'none'
  );

  return {
    user,
  };
}
