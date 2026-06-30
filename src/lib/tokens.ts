const TOKEN_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateToken(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length])
    .join("");
}

export function hashToken(token: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createParticipantUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/p/${encodeURIComponent(token)}`;
}
