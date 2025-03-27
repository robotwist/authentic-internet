# Quotes API Integration

This document explains the setup and usage of the quotes API integration for the Authentic Internet project.

## Overview

The quotes API integration provides reliable access to various types of quotes, including Shakespeare quotes, general quotes by author or tags, and Zen quotes. The system is designed with multiple fallback mechanisms to ensure availability even when external APIs are down.

## API Endpoints

### Shakespeare Quotes

- `GET /api/external/shakespeare` - Fetches a random Shakespeare quote
  - Query parameters:
    - `prompt` (optional): A prompt to guide the quote selection (e.g., "love", "mortality")
  - Response format:
    ```json
    {
      "text": "To be, or not to be, that is the question...",
      "source": "William Shakespeare, Hamlet",
      "work": "Hamlet",
      "character": "Hamlet",
      "additionalQuotes": ["Additional quote 1", "Additional quote 2"]
    }
    ```

### General Quotes

- `GET /api/external/quote` - Fetches a quote based on author or tags
  - Query parameters:
    - `author` (optional): Author name to filter by (e.g., "shakespeare", "aristotle")
    - `tags` (optional): Tags to filter by (e.g., "wisdom", "love")
  - Response format:
    ```json
    {
      "text": "The fault, dear Brutus, is not in our stars, but in ourselves.",
      "source": "William Shakespeare",
      "work": "Julius Caesar",
      "tags": ["wisdom", "responsibility"],
      "additionalQuotes": []
    }
    ```

### Zen Quotes

- `GET /api/external/zen` - Fetches a random Zen quote
  - Response format:
    ```json
    {
      "text": "Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.",
      "source": "Zen wisdom",
      "work": "Traditional teaching",
      "additionalQuotes": []
    }
    ```

## Client-Side Usage

```javascript
// Import the API functions
import { 
  getRandomShakespeareQuote,
  getQuoteByAuthor,
  getQuoteByTags,
  getZenQuote
} from '../api/api';

// Example usage
async function fetchShakespeareQuote() {
  try {
    const quoteData = await getRandomShakespeareQuote();
    console.log(quoteData.text);
  } catch (error) {
    console.error('Failed to fetch Shakespeare quote:', error);
  }
}

async function fetchAuthorQuote(author) {
  try {
    const quoteData = await getQuoteByAuthor(author);
    console.log(quoteData.text);
  } catch (error) {
    console.error(`Failed to fetch quote by ${author}:`, error);
  }
}

async function fetchTaggedQuote(tags) {
  try {
    const quoteData = await getQuoteByTags(tags);
    console.log(quoteData.text);
  } catch (error) {
    console.error(`Failed to fetch quote with tags ${tags}:`, error);
  }
}

async function fetchZenQuote() {
  try {
    const quoteData = await getZenQuote();
    console.log(quoteData.text);
  } catch (error) {
    console.error('Failed to fetch Zen quote:', error);
  }
}
```

## Implementation Details

The quotes API implementation uses a multi-tiered approach for reliability:

1. **Shakespeare quotes**:
   - First attempts to use the dedicated external API route
   - Falls back to the NPC route if external fails
   - Includes multi-source fallbacks on the server side

2. **General quotes**:
   - Uses the Quotable API for diverse quote content
   - Falls back to curated quotes by category if external API fails

3. **Zen quotes**:
   - Uses a curated collection of Zen wisdom quotes

## Testing

To test the quotes API endpoints, run:

```bash
node test-quotes.js
```

This will verify that all three quote endpoints are working correctly. 