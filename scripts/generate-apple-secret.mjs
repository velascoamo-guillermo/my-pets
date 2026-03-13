/**
 * Generates the Apple client_secret JWT required by Supabase
 * for Sign In with Apple (native flow).
 *
 * Usage:
 *   1. Copy your .p8 key file into this folder (scripts/)
 *   2. Fill in the 3 constants below
 *   3. Run: node scripts/generate-apple-secret.mjs
 *   4. Paste the output JWT into Supabase → Auth → Providers → Apple → Secret Key
 *
 * The JWT expires in 180 days (Apple's maximum). Regenerate when it expires.
 */

import { readFileSync } from "fs";
import { importPKCS8, SignJWT } from "jose";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ─── Fill these in ────────────────────────────────────────────────────────────
const TEAM_ID = "523MDDHYGD"; // 10-char Team ID (top-right of developer.apple.com)
const KEY_ID = "L8F287H76D"; // 10-char Key ID (visible on the key page)
const KEY_FILE = "AuthKey_L8F287H76D.p8"; // filename of your downloaded .p8 key
// ─────────────────────────────────────────────────────────────────────────────

const BUNDLE_ID = "com.guillermo.velasco.amo.mypets";

const __dir = dirname(fileURLToPath(import.meta.url));
const privateKey = readFileSync(join(__dir, KEY_FILE), "utf8");

const key = await importPKCS8(privateKey, "ES256");

const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: KEY_ID })
  .setIssuedAt()
  .setIssuer(TEAM_ID)
  .setAudience("https://appleid.apple.com")
  .setSubject(BUNDLE_ID)
  .setExpirationTime("180days")
  .sign(key);

console.log("\n✅ Apple client_secret JWT (valid 180 days):\n");
console.log(jwt);
console.log(
  "\nPaste this into: Supabase → Auth → Providers → Apple → Secret Key\n",
);
