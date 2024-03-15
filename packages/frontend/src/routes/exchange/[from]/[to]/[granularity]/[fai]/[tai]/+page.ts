export async function load({ params }) {
  return {
    fromAccountId: params.fai,
    toAccountId: params.tai,
    from: params.from,
    to: params.to,
    granularity: params.granularity,
  };
}
