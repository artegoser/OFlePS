import { serverClient } from '$lib/server.js';

export async function load({ params }) {
  const granularities = await serverClient.getGranularities();
  const orderBook = await serverClient.getOrderBook(params.from, params.to);

  return {
    fromAccountId: params.fai,
    toAccountId: params.tai,
    from: params.from,
    to: params.to,
    granularity: params.granularity,
    granularities,
    orderBook,
    price: `${(orderBook?.asks[0]?.price + orderBook?.bids[0]?.price) / 2}`,
  };
}
