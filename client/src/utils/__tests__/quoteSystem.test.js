import {
  getRandomQuote,
  getCategoryQuote,
  getCategories,
  QUOTE_CATEGORIES,
} from "../quoteSystem.js";

describe("Quote System", () => {
  test("getRandomQuote returns a valid quote", () => {
    const quote = getRandomQuote();
    expect(quote).toHaveProperty("text");
    expect(quote).toHaveProperty("author");
    expect(quote).toHaveProperty("type");
  });

  test("getCategoryQuote returns a quote from the specified category", () => {
    const quote = getCategoryQuote(QUOTE_CATEGORIES.WISDOM);
    expect(quote.type).toBe("wisdom");
  });

  test("getCategories returns all available categories", () => {
    const categories = getCategories();
    expect(categories).toContain("wisdom");
    expect(categories).toContain("literary");
    expect(categories).toContain("nature");
    expect(categories).toContain("inspiration");
  });
});
