const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const KDF_ITERATIONS = 150_000;

export interface SealInput {
  secret: string;
  clue: string;
  passphrase: string;
  revealNote: string;
}

export interface SealedEnvelope {
  version: 1;
  app: "fil-cnes";
  mechanic: "seal-reveal";
  kind: "encrypted-message";
  createdAt: string;
  clue: string;
  revealNote: string;
  plaintextDigest: string;
  crypto: {
    algorithm: "AES-GCM";
    kdf: "PBKDF2-SHA-256";
    iterations: number;
    salt: string;
    iv: string;
  };
  ciphertext: string;
  minimumSizePad: string;
}

export interface SealResult {
  envelope: SealedEnvelope;
  bytes: Uint8Array;
  digest: string;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function digestText(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: KDF_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function sealSecret(input: SealInput): Promise<SealResult> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(input.passphrase, salt);
  const digest = await digestText(input.secret);

  const plaintext = {
    app: "fil-cnes",
    secret: input.secret,
    clue: input.clue,
    revealNote: input.revealNote,
    sealedAt: new Date().toISOString(),
  };

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    textEncoder.encode(JSON.stringify(plaintext, null, 2)),
  );

  const envelope: SealedEnvelope = {
    version: 1,
    app: "fil-cnes",
    mechanic: "seal-reveal",
    kind: "encrypted-message",
    createdAt: new Date().toISOString(),
    clue: input.clue,
    revealNote: input.revealNote,
    plaintextDigest: digest,
    crypto: {
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations: KDF_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    minimumSizePad:
      "This pad keeps the Filecoin upload above the documented minimum while preserving encrypted contents.",
  };

  return {
    envelope,
    bytes: textEncoder.encode(JSON.stringify(envelope, null, 2)),
    digest,
  };
}

export async function revealSecret(bytes: Uint8Array, passphrase: string) {
  const envelope = JSON.parse(textDecoder.decode(bytes)) as SealedEnvelope;
  if (envelope.app !== "fil-cnes" || envelope.mechanic !== "seal-reveal") {
    throw new Error("This payload is not a fil-cnes sealed envelope.");
  }

  const key = await deriveKey(passphrase, base64ToBytes(envelope.crypto.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(envelope.crypto.iv)) },
    key,
    base64ToBytes(envelope.ciphertext),
  );

  return {
    envelope,
    plaintext: JSON.parse(textDecoder.decode(decrypted)) as {
      app: "fil-cnes";
      secret: string;
      clue: string;
      revealNote: string;
      sealedAt: string;
    },
  };
}
