// WebCrypto PBKDF2-SHA256. Format: pbkdf2-sha256$<iterations>$<saltB64>$<hashB64> (same as scripts/hash-password.mjs).
// ponytail: 100000 iterations, below OWASP's 600000, because Workers Free has a 10 ms CPU limit. Iterations live in the string so they can change per account.
const ITER = 100000;
const enc = new TextEncoder();

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number, bytes: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, bytes * 8);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, iterations = ITER) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iterations}$${b64(salt)}$${b64(await derive(password, salt, iterations, 32))}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const [alg, it, s, h] = stored.split("$");
    const iterations = Number(it);
    if (alg !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 1 || iterations > ITER || !s || !h) return false;
    const want = unb64(h);
    if (want.length !== 32) return false;
    const got = await derive(password, unb64(s), iterations, want.length);
    let diff = 0;
    for (let i = 0; i < want.length; i++) diff |= got[i] ^ want[i];
    return diff === 0;
  } catch {
    return false;
  }
}
