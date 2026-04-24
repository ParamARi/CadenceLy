import { isEditionMetadataParenInner } from "@/lib/bpm/editionParenPatterns";

const SQUARE_CURLY_REGEX = /\[[^\]]*]|\{[^}]*\}/g;
const TRAILING_PAREN_REGEX = /\s*\(([^)]*)\)\s*$/;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripQuotes(value: string): string {
  return value.replace(/["'`]/g, "").trim();
}

/** Removes [...] and {...} chunks (promotional / tag noise). Round parens handled separately. */
export function stripSquareAndCurlyBrackets(title: string): string {
  return collapseWhitespace(title.replace(SQUARE_CURLY_REGEX, " "));
}

/**
 * Removes final "(...)" segments only when inner text matches edition/promo heuristics.
 * Preserves legitimate titles like "I Want You (She's So Heavy) (2019 Mix)" → strips only the last segment.
 */
export function stripTrailingMetadataParens(title: string): string {
  let t = title.trim();
  if (!t) return "";

  for (let i = 0; i < 24; i++) {
    const m = t.match(TRAILING_PAREN_REGEX);
    if (!m || m.index === undefined) break;
    const inner = m[1] ?? "";
    if (!isEditionMetadataParenInner(inner)) break;
    t = t.slice(0, m.index).trimEnd();
  }
  return collapseWhitespace(t);
}

/**
 * Full normalization for GetSong / tempo lookup: strip square/curly brackets, then
 * strip trailing edition/promo parentheses, then tidy quotes and spaces.
 */
export function normalizeCatalogTitleForLookup(raw: string): string {
  let t = stripQuotes(raw);
  t = collapseWhitespace(t);
  if (!t) return "";
  t = stripSquareAndCurlyBrackets(t);
  t = stripTrailingMetadataParens(t);
  return collapseWhitespace(stripQuotes(t));
}
