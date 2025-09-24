const encoder = new TextEncoder();

export const hashStringHex = async (input: string): Promise<string> => {
  const encoded = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
};
