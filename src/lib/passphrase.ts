const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const ALL = `${UPPERCASE}${LOWERCASE}${DIGITS}`;

export function generatePassphrase(length = 24): string {
  if (length < 3) {
    throw new Error("Passphrase length must allow all character classes.");
  }

  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure randomness is unavailable.");
  }

  const randomValues = new Uint32Array(length);
  cryptoApi.getRandomValues(randomValues);

  const characters = Array.from(
    randomValues,
    (value) => ALL[value % ALL.length]!,
  );

  const reservedIndices = new Set<number>();
  ensureClass(characters, UPPERCASE, reservedIndices);
  ensureClass(characters, LOWERCASE, reservedIndices);
  ensureClass(characters, DIGITS, reservedIndices);

  return characters.join("");
}

export async function copyPassphraseToClipboard(
  passphrase: string,
): Promise<void> {
  try {
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard?.writeText) {
      await clipboard.writeText(passphrase);
    }
  } catch {
    // Swallow clipboard failures to avoid noisy UX; spec requires silent copy.
  }
}

function ensureClass(
  characters: string[],
  pool: string,
  reservedIndices: Set<number>,
): void {
  if (characters.some((char) => pool.includes(char))) {
    return;
  }

  let index = randomIndex(characters.length);
  while (reservedIndices.has(index)) {
    index = randomIndex(characters.length);
  }
  reservedIndices.add(index);
  characters[index] = pool[randomIndex(pool.length)]!;
}

function randomIndex(max: number): number {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error("Secure randomness is unavailable.");
  }

  const buffer = new Uint32Array(1);
  cryptoApi.getRandomValues(buffer);
  return buffer[0]! % max;
}
