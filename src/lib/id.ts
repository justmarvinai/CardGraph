const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function createId(prefix = ''): string {
  let out = '';
  const bytes = new Uint8Array(10);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return prefix ? `${prefix}_${out}` : out;
}
