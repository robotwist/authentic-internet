import React, { useState, useEffect } from 'react';
import { getRandomShakespeareQuote, getZenQuote } from '../utils/apiService';
import { getRandomQuoteFromArray, DAILY_QUOTES } from '../utils/fallbackQuotes';
import './QuoteDisplay.css';

const DailyQuote = ({ onSaveQuote }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDailyQuote = async () => {
      setLoading(true);
      try {
        // Try to get a quote from an external API
        let quoteResponse;
        const random = Math.random();
        
        if (random < 0.4) {
          quoteResponse = await getRandomShakespeareQuote();
          if (quoteResponse && quoteResponse.quote) {
            setQuote({
              text: quoteResponse.quote,
              source: "William Shakespeare",
              npcType: "shakespeare"
            });
            setLoading(false);
            return;
          }
        } else if (random < 0.8) {
          quoteResponse = await getZenQuote();
          if (quoteResponse && quoteResponse.q) {
            setQuote({
              text: quoteResponse.q,
              source: quoteResponse.a || "Zen Wisdom",
              npcType: "zen"
            });
            setLoading(false);
            return;
          }
        }
        
        // Fallback to local quotes if API fails
        const fallbackQuote = getRandomQuoteFromArray(DAILY_QUOTES);
        setQuote({
          text: fallbackQuote.text,
          source: fallbackQuote.author || "Ancient Wisdom",
          npcType: fallbackQuote.type || "daily"
        });
      } catch (error) {
        console.error("Error fetching daily quote:", error);
        // Fallback to local quotes if API fails
        const fallbackQuote = getRandomQuoteFromArray(DAILY_QUOTES);
        setQuote({
          text: fallbackQuote.text,
          source: fallbackQuote.author || "Ancient Wisdom",
          npcType: fallbackQuote.type || "daily"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDailyQuote();
  }, []);

  const handleSaveQuote = () => {
    if (quote && onSaveQuote) {
      onSaveQuote(quote);
    }
  };

  if (loading) {
    return (
      <div className="daily-quote-loading">
        <p>Finding today's wisdom...</p>
      </div>
    );
  }

  return (
    <div className="daily-quote">
      {quote && (
        <>
          <blockquote className="daily-quote-text">
            "{quote.text}"
          </blockquote>
          <div className="daily-quote-source">
            — <span className="source-name">{quote.source}</span>
          </div>
          {onSaveQuote && (
            <button 
              className="daily-quote-save-button" 
              onClick={handleSaveQuote}
              aria-label="Save this quote to your collection"
            >
              Add to My Collection
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DailyQuote; 