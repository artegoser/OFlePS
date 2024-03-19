import { serverClient } from '$lib/server';

export async function load() {
  const granularities = await serverClient.getGranularities();

  return {
    granularities,
  };
}
