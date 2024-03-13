export async function load({ params }) {
  return {
    from: params.from,
    to: params.to,
    granularity: params.granularity,
  };
}
