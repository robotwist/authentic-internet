import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/shared/Layout";
import Button from "../components/shared/Button";
import DailyQuote from "../components/DailyQuote";
import SecretMessage from "../components/SecretMessage";
import TitleArea from "../components/TitleArea";
import "../styles/Home.css";
import { getRandomQuote } from "../utils/quoteSystem.js";
import { updateCharacter } from "../api/api";

const Home = () => {
  const { user } = useAuth();
  const [inspirationalQuotes, setInspirationalQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [showSecretMessage, setShowSecretMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      try {
        // Get quotes from different categories
        const quotes = await Promise.all([
          getRandomQuote("inspiration"),
          getRandomQuote("wisdom"),
          getRandomQuote("literary"),
        ]);

        // Format the quotes
        const formattedQuotes = quotes.map((quote) => ({
          text: quote.text,
          source: quote.author,
          type: quote.type,
          timestamp: new Date().toISOString(),
        }));

        setInspirationalQuotes(formattedQuotes);
      } catch (error) {
        console.error("Error fetching quotes:", error);
        // Use fallback quotes
        setInspirationalQuotes([
          {
            text: "Write hard and clear about what hurts.",
            source: "Ernest Hemingway",
            type: "literary",
            timestamp: new Date().toISOString(),
          },
          {
            text: "The mountains are calling and I must go.",
            source: "John Muir",
            type: "nature",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const handleSaveQuote = async (quote) => {
    if (!user) {
      alert("Log in to save quotes to your in-game collection.");
      return;
    }

    try {
      // Get user's character data
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser || !storedUser.id) {
        alert("We could not load your profile. Please sign in again.");
        return;
      }

      // Fetch the current character
      const character = JSON.parse(localStorage.getItem("character")) || {};

      // Add the quote to the saved quotes array
      const savedQuotes = character.savedQuotes || [];

      // Check if this quote is already saved
      const isAlreadySaved = savedQuotes.some((q) => q.text === quote.text);
      if (isAlreadySaved) {
        alert("That quote is already in your collection.");
        return;
      }

      // Add the new quote
      const updatedQuotes = [...savedQuotes, quote];

      // Update the character object
      const updatedCharacter = {
        ...character,
        savedQuotes: updatedQuotes,
      };

      // Save to localStorage
      localStorage.setItem("character", JSON.stringify(updatedCharacter));

      // If the character has an ID, also update in the database
      if (character.id) {
        await updateCharacter(updatedCharacter);
      }

      // Show success message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
    } catch (error) {
      console.error("Error saving quote:", error);
      alert("Could not save the quote. Try again in a moment.");
    }
  };

  const handleCreateNewWorld = (e) => {
    e.preventDefault();
    setShowSecretMessage(true);
  };

  const header = (
    <div className="home-header">
      <TitleArea size="large" />
      <p className="subtitle">
        A quieter corner of the web: explore worlds, meet curious characters,
        and leave behind artifacts that matter.
      </p>
    </div>
  );

  const content = (
    <div className="home-content-wrapper">
      {/* Main messaging */}
      <div className="create-artifacts-section">
        <h2>The True, the Good, and the Beautiful</h2>
        <p className="creative-description">
          Authentic Internet is a small game world built around discovery and
          craft: your artifacts and other players&apos; work carry weight here.
        </p>
        <div className="creative-steps">
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Freedom</h3>
          </div>
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Creation</h3>
            <p>
              Make artifacts that reflect what you care about—and collect what
              others have left in the world.
            </p>
          </div>
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Authenticity</h3>
          </div>
        </div>
        <Button
          as={Link}
          to="/game"
          variant="primary"
          className="create-button"
        >
          Explore the world
        </Button>
      </div>

      {user ? (
        <div className="authenticated-content">
          <h2>Your worlds</h2>
          <div className="worlds-grid">
            <p className="worlds-placeholder">
              Summaries of your worlds and progress will show up here as we
              wire this section up.
            </p>
          </div>

          {/* Show SecretMessage or buttons based on state */}
          {showSecretMessage ? (
            <SecretMessage />
          ) : (
            <div className="action-buttons">
              <Button onClick={handleCreateNewWorld} variant="primary">
                Create New World
              </Button>
              <Button as={Link} to="/dashboard" variant="secondary">
                Open dashboard
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="unauthenticated-content">
          <p>
            Sign in to sync your character and save quotes, or create an account
            to begin.
          </p>
          <div className="action-buttons">
            <Button as={Link} to="/login" variant="primary">
              Log in
            </Button>
            <Button as={Link} to="/register" variant="secondary">
              Create account
            </Button>
          </div>
        </div>
      )}

      {/* Quotes section */}
      <div className="daily-wisdom-section">
        <h2>Today&apos;s wisdom</h2>
        <p className="wisdom-intro">
          Save lines you like to your in-game collection, share them with
          friends, or export them when you want a keepsake.
        </p>

        {loading ? (
          <div className="quotes-loading">Loading quotes…</div>
        ) : (
          <div className="inspirational-quotes">
            {inspirationalQuotes.map((quote, index) => (
              <div key={index} className="quote-card">
                <div className="quote-card-content">
                  <p className="quote-text">"{quote.text}"</p>
                  <p className="quote-source">
                    {quote.type && (
                      <span className="quote-type">{quote.type}: </span>
                    )}
                    {quote.source}
                  </p>
                </div>
                <button
                  className="save-quote-button"
                  onClick={() => handleSaveQuote(quote)}
                >
                  Save to collection
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Daily quote component */}
        <div className="daily-quote-container">
          <h3>Quote of the day</h3>
          <DailyQuote onSave={handleSaveQuote} />
        </div>

        {/* Game CTA */}
        <div className="game-cta">
          <h3>Ready when you are</h3>
          <p>
            Roam the maps, talk to characters rooted in history and literature,
            and grow your collection of artifacts and quotes.
          </p>
          <Button as={Link} to="/game" variant="primary">
            {user ? "Continue playing" : "Play now"}
          </Button>
        </div>
      </div>

      {/* Saved message notification */}
      {showSavedMessage && (
        <div className="save-notification">Saved to your collection.</div>
      )}
    </div>
  );

  return (
    <Layout className="home-container">
      <Layout.Header>{header}</Layout.Header>
      <Layout.Main className="home-content">{content}</Layout.Main>
    </Layout>
  );
};

export default Home;
