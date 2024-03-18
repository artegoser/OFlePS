import { serverClient } from '$lib/server.js';

export async function load({ params }) {
  const account = await serverClient.getAccountById(params.id);

  return {
    account,
    id: params.id,
  };
}
