import type { AppRouter } from "ofleps-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

function createTRPC(baseUrl: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: baseUrl,
      }),
    ],
  });
}

export default class Client {
  private _t;
  constructor(baseUrl: string) {
    this._t = createTRPC(baseUrl);
  }

  transactions(from: number, to: number) {
    return this._t.transactions.query({ from, to });
  }
}
