export interface User {
  alias: string;
  totp_key: string;
}

export interface JWTPayload {
  user: User;
}
