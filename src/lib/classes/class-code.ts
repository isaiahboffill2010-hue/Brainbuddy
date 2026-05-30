const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeClassCode(code: string) {
  const compact = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.startsWith("BB") && compact.length > 2
    ? `BB-${compact.slice(2)}`
    : compact;
}

export function generateClassCode() {
  let code = "BB-";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
