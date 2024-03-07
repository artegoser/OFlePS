import { TRPCError } from "@trpc/server";

type ErrorCodes =
  | "INTERNAL_SERVER_ERROR"
  | "PARSE_ERROR"
  | "BAD_REQUEST"
  | "NOT_IMPLEMENTED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_SUPPORTED"
  | "TIMEOUT"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE_CONTENT"
  | "TOO_MANY_REQUESTS"
  | "CLIENT_CLOSED_REQUEST";

export abstract class OflepsError extends TRPCError {
  code: ErrorCodes;
  name: string;
  message: string;

  constructor(code: ErrorCodes, name: string, message: string) {
    super({ code, message });
    this.code = code;
    this.name = name;
    this.message = message;
  }
}

export class NotFoundError extends OflepsError {
  constructor(message: string) {
    super(
      "NOT_FOUND",
      "Not found",
      `The requested resource was not found: ${message}`
    );
  }
}

export class BadRequestError extends OflepsError {
  constructor(description: string) {
    super("BAD_REQUEST", "Bad request", description);
  }
}
