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
      alert("You need to be logged in to save quotes. Please log in first.");
      return;
    }

    try {
      // Get user's character data
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser || !storedUser.id) {
        alert("No user profile found. Please log in again.");
        return;
      }

      // Fetch the current character
      const character = JSON.parse(localStorage.getItem("character")) || {};

      // Add the quote to the saved quotes array
      const savedQuotes = character.savedQuotes || [];

      // Check if this quote is already saved
      const isAlreadySaved = savedQuotes.some((q) => q.text === quote.text);
      if (isAlreadySaved) {
        alert("This quote is already in your saved quotes!");
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
      alert("Failed to save quote. Please try again.");
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
        Enter the place where you are free to experience the goodness of the
        internet. Here you can experience a site with nothing glaring in the
        way. You get to see creativity in an unadulterated form.
      </p>
    </div>
  );

  const content = (
    <div className="home-content-wrapper">
      {/* Main messaging */}
      <div className="create-artifacts-section">
        <h2>The True, The Good, The Beautiful</h2>
        <p className="creative-description">
          This is the Authentic Internet. A place where creativity and
          expression reign supreme, where your artifacts matter and others'
          creations matter to you.
        </p>
        <p className="creative-description">
          No one is selling your information, your data, or spamming you with
          false products, ideas or things. When you enter here, you choose what
          you want to see and strike everything else from your view.
        </p>
        <div className="creative-steps">
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Freedom</h3>
            <p>Choose your world that you want to see.</p>
          </div>
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Authenticity</h3>
            <p>Escape a world of the manipulative.</p>
          </div>
          <div className="creative-step">
            <div className="step-icon"></div>
            <h3>Creation</h3>
            <p>
              Express yourself through meaningful artifacts that reflect your
              wisdom and creativity.
            </p>
          </div>
        </div>
        <Button
          as={Link}
          to="/game"
          variant="primary"
          className="create-button"
        >
          Enter A New World
        </Button>
      </div>

      {user ? (
        <div className="authenticated-content">
          <h2>Your Worlds</h2>
          <div className="worlds-grid">
            {/* We'll add the worlds list here later */}
            <p>Your worlds will appear here...</p>
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
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="unauthenticated-content">
          <p>Please log in or register to start your journey</p>
          <div className="action-buttons">
            <Button as={Link} to="/login" variant="primary">
              Login
            </Button>
            <Button as={Link} to="/register" variant="secondary">
              Register
            </Button>
          </div>
        </div>
      )}

      {/* Quotes section */}
      <div className="daily-wisdom-section">
        <h2>Today's Wisdom</h2>
        <p className="wisdom-intro">
          Collect these quotes and add them to your in-game quote collection.
          Share them with friends or export them as a beautiful quote book.
        </p>

        {loading ? (
          <div className="quotes-loading">Loading wisdom...</div>
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
                  Save to Collection
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Daily quote component */}
        <div className="daily-quote-container">
          <h3>Quote of the Day</h3>
          <DailyQuote onSave={handleSaveQuote} />
        </div>

        {/* Game CTA */}
        <div className="game-cta">
          <h3>Continue Your Journey</h3>
          <p>
            Explore the world, meet historical figures, and collect more wisdom.
          </p>
          <Button as={Link} to="/game" variant="primary">
            Enter the Game
          </Button>
        </div>
      </div>

      {/* Saved message notification */}
      {showSavedMessage && (
        <div className="save-notification">Quote saved to your collection!</div>
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
