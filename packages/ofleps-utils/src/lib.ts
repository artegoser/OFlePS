const encoder = new TextEncoder();
export function encode(str: string) {
  return encoder.encode(str);
}

const decoder = new TextDecoder();
export function decode(bytes: Uint8Array) {
  return decoder.decode(bytes);
}

export function stringify(obj: any) {
  return JSON.stringify(obj);
}
