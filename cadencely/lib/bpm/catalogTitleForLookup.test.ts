import { describe, expect, it } from "vitest";
import {
  normalizeCatalogTitleForLookup,
  stripSquareAndCurlyBrackets,
  stripTrailingMetadataParens,
} from "./catalogTitleForLookup";
import { isEditionMetadataParenInner } from "./editionParenPatterns";

describe("stripTrailingMetadataParens", () => {
  it("strips remaster / mix year suffixes", () => {
    expect(stripTrailingMetadataParens("Something (2019 Mix)")).toBe("Something");
    expect(stripTrailingMetadataParens("Warning (2025 Remaster)")).toBe("Warning");
  });

  it("strips only the last metadata paren, preserving catalog title parens", () => {
    expect(stripTrailingMetadataParens("I Want You (She's So Heavy) (2019 Mix)")).toBe(
      "I Want You (She's So Heavy)"
    );
  });

  it("strips deluxe / anniversary edition bundles", () => {
    expect(stripTrailingMetadataParens("Warning (25th Anniversary Deluxe Edition)")).toBe(
      "Warning"
    );
  });

  it("does not strip when the only paren is not metadata", () => {
    expect(stripTrailingMetadataParens("Rockin' Around (Christmas Tree)")).toBe(
      "Rockin' Around (Christmas Tree)"
    );
  });

  it("strips multiple trailing metadata segments", () => {
    expect(stripTrailingMetadataParens("Track (Deluxe) (2020 Remaster)")).toBe("Track");
  });
});

describe("stripSquareAndCurlyBrackets", () => {
  it("removes square and curly segments only", () => {
    expect(stripSquareAndCurlyBrackets("Hello [Official Video] {HD}")).toBe("Hello");
  });
});

describe("normalizeCatalogTitleForLookup", () => {
  it("combines bracket strip and trailing metadata parens", () => {
    expect(normalizeCatalogTitleForLookup("Song Name [HD] (2025 Remaster)")).toBe("Song Name");
  });

  it("handles Adele-style YouTube title", () => {
    expect(normalizeCatalogTitleForLookup("Adele - Hello [Official Video]")).toBe(
      "Adele - Hello"
    );
  });
});

describe("isEditionMetadataParenInner", () => {
  it("treats common edition strings as metadata", () => {
    expect(isEditionMetadataParenInner("2019 Mix")).toBe(true);
    expect(isEditionMetadataParenInner("Official Video")).toBe(true);
  });

  it("does not treat song-title parens as metadata", () => {
    expect(isEditionMetadataParenInner("She's So Heavy")).toBe(false);
    expect(isEditionMetadataParenInner("Christmas Tree")).toBe(false);
  });
});
