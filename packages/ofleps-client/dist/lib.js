"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@trpc/client");
function Client(baseUrl) {
    return (0, client_1.createTRPCProxyClient)({
        links: [
            (0, client_1.httpBatchLink)({
                url: baseUrl,
            }),
        ],
    });
}
exports.default = Client;
