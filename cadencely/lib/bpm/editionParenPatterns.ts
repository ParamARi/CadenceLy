/**
 * Heuristics for trailing "(...)" segments that are edition / promo metadata,
 * not part of the canonical song title. Extend this list as real-world misses appear.
 *
 * Matching is case- and Unicode-insensitive (NFKC + lowercase) on the full inner string.
 */

/** Normalizes inner text for comparison (Unicode fold + collapse spaces). */
export function normalizeParenInner(inner: string): string {
  return inner
    .trim()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Regexes tested against {@link normalizeParenInner}'d inner string (full string).
 * Add patterns conservatively; false positives remove real title parts.
 */
export const EDITION_PAREN_INNER_REGEXES: RegExp[] = [
  // Year + mix / remaster / channel variants
  /^(19|20)\d{2}\s*(remaster(ed)?|mix|master|stereo\s*mix|mono|stereo)(\s+version)?$/i,
  /^(19|20)\d{2}\b.*\b(remaster(ed)?|mix|master|stereo|mono)\b/i,
  // Deluxe / anniversary / edition bundles
  /\b(super\s+)?deluxe\b/i,
  /\b(25th|1st|2nd|3rd|\d+(st|nd|rd|th))\s+anniversary\b/i,
  /\banniversary\b.*\b(deluxe|edition|remaster)/i,
  /\b(deluxe|expanded|reissue|bonus(\s+tracks?)?|special\s+edition)\b/i,
  /\b(limited|collector'?s?)\s+edition\b/i,
  // French / common EU retail strings
  /\bédition\s+de\s+luxe(use)?\b/i,
  /\b(remasteris(é|e))\b/i,
  // Promo in parentheses (trailing only — applied by caller)
  /\b(official\s+video|official\s+audio|lyrics?\s*video|visualizer|audio\s+only)\b/i,
  // Mix labels without a leading year
  /\b(extended\s+mix|radio\s+edit|club\s+mix|instrumental)\b/i,
];

export function isEditionMetadataParenInner(inner: string): boolean {
  const n = normalizeParenInner(inner);
  if (!n) return false;
  return EDITION_PAREN_INNER_REGEXES.some((re) => re.test(n));
}
