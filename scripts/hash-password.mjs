// Usage: node scripts/hash-password.mjs <password> [iterations]
// Prints pbkdf2-sha256$<iterations>$<saltB64>$<hashB64>. lib/password.ts verifies the same format
// with WebCrypto. Iterations are stored in the string so they can be lowered per account (Workers
// Free has a 10 ms CPU limit and may cap PBKDF2 at 100000; never exceed that).
import { pbkdf2Sync, randomBytes } from "node:crypto";

const [password, iter = "100000"] = process.argv.slice(2);
if (!password) { console.error("usage: node scripts/hash-password.mjs <password> [iterations]"); process.exit(1); }
const iterations = Number(iter);
if (!Number.isInteger(iterations) || iterations < 1 || iterations > 100000) {
  console.error("iterations must be an integer from 1 to 100000"); process.exit(1);
}
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
console.log(`pbkdf2-sha256$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`);
