// Superíndices Unicode que se aceptan al escribir L y que se usan al mostrarlo.
// prettier-ignore
export const SUPERSCRIPT_TO_PLAIN: Readonly<Record<string, string>> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', 'ⁿ': 'n', 'ᵐ': 'm', 'ᵏ': 'k', 'ⁱ': 'i', 'ʲ': 'j', 'ᵖ': 'p', 'ʳ': 'r', 'ˢ': 's',
  'ᵗ': 't', 'ᵘ': 'u', 'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z', 'ᵃ': 'a', 'ᵇ': 'b',
  'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e', 'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ˡ': 'l', 'ᵒ': 'o',
}

const PLAIN_TO_SUPERSCRIPT: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SUPERSCRIPT_TO_PLAIN).map(([superscript, plain]) => [plain, superscript]),
)

/** "2n" → "²ⁿ". Si algún carácter no tiene superíndice (q), usa la forma con ^. */
export function toSuperscript(text: string): string {
  const chars = [...text]
  if (chars.every((ch) => ch in PLAIN_TO_SUPERSCRIPT)) {
    return chars.map((ch) => PLAIN_TO_SUPERSCRIPT[ch]).join('')
  }
  return chars.length === 1 ? `^${text}` : `^(${text})`
}
