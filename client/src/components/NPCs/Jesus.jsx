import React, { useState, useEffect } from 'react';
import { handleNPCInteraction } from '../../api/api';
import './NPC.css';
import './Jesus.css';

// Fallback quotes in case the API fails
const JESUS_QUOTES = [
  {
    text: "Love your enemies, do good to those who hate you, bless those who curse you, pray for those who mistreat you.",
    source: "Luke 6:27-28",
    context: "Sermon on the Plain"
  },
  {
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    source: "John 3:16",
    context: "Conversation with Nicodemus"
  },
  {
    text: "I am the way and the truth and the life. No one comes to the Father except through me.",
    source: "John 14:6",
    context: "Last Supper discourse"
  },
  {
    text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.",
    source: "Matthew 7:7",
    context: "Sermon on the Mount"
  },
  {
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
    source: "Matthew 11:28",
    context: "Invitation to the weary"
  }
];

// Function to get random quote from array
const getRandomQuoteFromArray = (quotesArray) => {
  if (!quotesArray || quotesArray.length === 0) return null;
  return quotesArray[Math.floor(Math.random() * quotesArray.length)];
};

const Jesus = ({ onInteract, onClose, character, onSaveQuote }) => {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [savedQuotes, setSavedQuotes] = useState(character?.savedQuotes || []);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // When Jesus is rendered, fetch quotes
    fetchJesusQuotes();
  }, []);

  // Update saved quotes when character changes
  useEffect(() => {
    if (character?.savedQuotes) {
      setSavedQuotes(character.savedQuotes);
    }
  }, [character?.savedQuotes]);
  
  const fetchJesusQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the NPC interaction API route first
      try {
        console.log('Fetching Jesus quote from API...');
        const response = await handleNPCInteraction({
          npcId: 'jesus',
          message: "Share a teaching",
          userId: localStorage.getItem('userId')
        });
        
        if (response && response.message) {
          // Create a quote object
          const quote = {
            text: response.message,
            source: response.source || "Bible",
            context: response.context || "Teaching",
            timestamp: new Date().toISOString()
          };
          
          setQuotes([quote]);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('API Jesus quote failed, using fallback method', apiError);
      }
      
      // Final fallback - use local quotes
      console.log('Using local fallback quotes for Jesus...');
      const fallbackQuote = getRandomQuoteFromArray(JESUS_QUOTES);
      if (fallbackQuote) {
        const quote = {
          text: fallbackQuote.text,
          source: fallbackQuote.source,
          context: fallbackQuote.context || "Teaching",
          timestamp: new Date().toISOString()
        };
        
        setQuotes([quote]);
      } else {
        throw new Error('No fallback quotes available');
      }
    } catch (error) {
      console.error("Error fetching Jesus quotes:", error);
      setError('Failed to fetch quotes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveQuote = (quote) => {
    // If no quote to save, don't proceed
    if (!quote || !quote.text) return;
    
    // If this quote is already saved, don't save it again
    if (savedQuotes?.some(q => q.text === quote.text)) {
      console.log("Quote already saved:", quote.text);
      return false;
    }
    
    // Call the parent's onSaveQuote function
    if (onSaveQuote) {
      onSaveQuote(quote);
      
      // Update local state
      setSavedQuotes(prev => [...prev, quote]);
      return true;
    }
    
    return false;
  };
  
  const handleInteract = async () => {
    // Refresh quotes when interacting
    await fetchJesusQuotes();
    onInteract('jesus');
  };
  
  return (
    <div className="npc jesus" onClick={handleInteract}>
      <div className="npc-avatar">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <span className="jesus-emoji">✝️</span>
        )}
      </div>
      
      {quotes.length > 0 && (
        <div className="quote-preview">
          <div className="quote-text-preview">
            {quotes[0].text.length > 30 
              ? `${quotes[0].text.substring(0, 30)}...` 
              : quotes[0].text}
          </div>
          
          <div className="quote-actions">
            <button 
              className={`save-quote-btn ${savedQuotes?.some(q => q.text === quotes[0].text) ? 'saved' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSaveQuote(quotes[0]);
              }}
            >
              {savedQuotes?.some(q => q.text === quotes[0].text) ? '✓ Saved' : 'Save Quote'}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <div className="npc-info">
        <div className="npc-name">Jesus</div>
        <div className="jesus-title">Teacher</div>
      </div>
    </div>
  );
};

export default Jesus; 