import React, { useState, useEffect } from "react";
import { handleNPCInteraction } from "../../api/api";
import { API_CONFIG, buildApiUrl } from "../../utils/apiConfig";
import axios from "axios";
import "./Shakespeare.css";
import "./NPC.css";

const Shakespeare = ({ onInteract, onClose, character, onSaveQuote }) => {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [savedQuotes, setSavedQuotes] = useState(character?.savedQuotes || []);

  useEffect(() => {
    // When Shakespeare is rendered, fetch quotes
    fetchShakespeareQuotes();
  }, []);

  // Update saved quotes when character changes
  useEffect(() => {
    if (character?.savedQuotes) {
      setSavedQuotes(character.savedQuotes);
    }
  }, [character?.savedQuotes]);

  const fetchShakespeareQuotes = async () => {
    try {
      setLoading(true);

      // Get a random Shakespeare quote from Folger API
      try {
        // Try to get a random Shakespeare line through our API config
        const plays = ["Ham", "Mac", "Rom", "Oth", "Lr", "JC", "MV", "Ado"];
        const randomPlay = plays[Math.floor(Math.random() * plays.length)];

        // Get a random line number (most plays have at least 2000 lines)
        const randomLineNum = Math.floor(Math.random() * 2000) + 1;
        const paddedLineNum = randomLineNum.toString().padStart(4, "0");

        const url = `${API_CONFIG.folger.baseUrl}/${randomPlay}/ftln/${paddedLineNum}`;
        const response = await axios.get(url);

        if (response.data && typeof response.data === "string") {
          // Extract the quote from the HTML response
          const textMatch = response.data.match(
            /<div class="line-text">(.*?)<\/div>/,
          );

          if (textMatch && textMatch[1]) {
            const text = textMatch[1].replace(/<[^>]*>/g, "");
            const playName = getPlayName(randomPlay);

            // Create a quote object
            const quote = {
              text: text,
              source: `${playName} - Shakespeare`,
              timestamp: new Date().toISOString(),
            };

            setQuotes([quote]);
            setLoading(false);
            return;
          }
        }

        throw new Error("Failed to extract Shakespeare quote");
      } catch (directApiError) {
        console.log(
          "Direct Folger API failed, falling back to NPC API",
          directApiError,
        );
      }

      // Fallback to NPC interaction
      const response = await handleNPCInteraction({
        npcId: "shakespeare",
        message: "Share a quote from your works",
        userId: localStorage.getItem("userId"),
      });

      if (response && response.message) {
        // Create a quote object
        const quote = {
          text: response.message,
          source: response.source || "Shakespeare",
          timestamp: new Date().toISOString(),
        };

        setQuotes([quote]);
      }
    } catch (error) {
      console.error("Error fetching Shakespeare quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full play name from code
  const getPlayName = (playCode) => {
    const playNames = {
      Ham: "Hamlet",
      Mac: "Macbeth",
      Lr: "King Lear",
      Rom: "Romeo and Juliet",
      Tmp: "The Tempest",
      MND: "A Midsummer Night's Dream",
      Oth: "Othello",
      JC: "Julius Caesar",
      MV: "The Merchant of Venice",
      Ado: "Much Ado About Nothing",
    };

    return playNames[playCode] || playCode;
  };

  const handleSaveQuote = (quote) => {
    // If no quote to save, don't proceed
    if (!quote || !quote.text) return;

    // If this quote is already saved, don't save it again
    if (savedQuotes?.some((q) => q.text === quote.text)) {
      console.log("Quote already saved:", quote.text);
      return false;
    }

    // Call the parent's onSaveQuote function
    if (onSaveQuote) {
      onSaveQuote(quote);

      // Update local state
      setSavedQuotes((prev) => [...prev, quote]);
      return true;
    }

    return false;
  };

  const handleInteract = async () => {
    // Refresh quotes when interacting
    await fetchShakespeareQuotes();
    onInteract("shakespeare");
  };

  return (
    <div className="npc shakespeare" onClick={handleInteract}>
      <div className="npc-avatar">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <span className="shakespeare-emoji">📜</span>
        )}
      </div>

      {quotes.length > 0 && (
        <div className="quote-preview">
          <div className="quote-text-preview">
            {quotes[0].text.substring(0, 30)}...
          </div>
          <button
            className={`save-quote-btn ${savedQuotes?.some((q) => q.text === quotes[0].text) ? "saved" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveQuote(quotes[0]);
            }}
          >
            {savedQuotes?.some((q) => q.text === quotes[0].text)
              ? "✓ Saved"
              : "Save Quote"}
          </button>
        </div>
      )}

      <div className="npc-info">
        <div className="npc-name">Shakespeare</div>
        <div className="shakespeare-title">Wordsmith</div>
      </div>
    </div>
  );
};

export default Shakespeare;
