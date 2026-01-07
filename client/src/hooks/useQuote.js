import { useState, useEffect } from "react";
import { getRandomQuote, getCategoryQuote } from "../utils/quoteSystem.js";

/**
 * Custom hook for fetching and managing quotes
 * @param {Object} options - Configuration options
 * @param {string} options.source - Quote source ('general', 'wisdom', 'nature', 'inspiration')
 * @param {string} options.theme - Theme for themed quotes (maps to category)
 * @returns {Object} Quote data and loading state
 */
export function useQuote({ source = "general", theme = null }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      let quoteData;

      switch (source) {
        case "wisdom":
          quoteData = getCategoryQuote("wisdom");
          break;
        case "nature":
          quoteData = getCategoryQuote("nature");
          break;
        case "inspiration":
          quoteData = getCategoryQuote("inspiration");
          break;
        case "themed":
          quoteData = getCategoryQuote(theme || "literary");
          break;
        case "general":
        default:
          quoteData = getRandomQuote();
      }

      setQuote(quoteData);
    } catch (err) {
      console.error("Failed to fetch quote:", err);
      setError(err.message || "Failed to fetch quote");
      setQuote({
        text: "The best way out is always through.",
        author: "Robert Frost",
        type: "wisdom",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately when the hook is used
    fetchQuote();
  }, [source, theme]);

  return { quote, loading, error, refetch: fetchQuote };
}

export default useQuote;
