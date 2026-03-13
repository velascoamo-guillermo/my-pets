import * as ExpoCrypto from "expo-crypto";

// Polyfill crypto for Supabase PKCE flow
if (typeof global.crypto === "undefined") {
  (global as unknown as Record<string, unknown>).crypto = {};
}

const cryptoGlobal = global.crypto as unknown as Record<string, unknown>;

if (!cryptoGlobal.getRandomValues) {
  cryptoGlobal.getRandomValues = ExpoCrypto.getRandomValues;
}

if (!cryptoGlobal.subtle) {
  cryptoGlobal.subtle = {
    digest: (_algorithm: string, data: ArrayBuffer) =>
      ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data),
  };
}
