import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isGamePage =
    location.pathname.includes("/world") || location.pathname.includes("/game");

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Authentic Internet</Link>
      </div>

      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/artifacts">Artifacts</Link>
            <Link to="/collaboration">Collaboration</Link>
            <Link to="/profile">Profile</Link>

            {/* Game-specific quick access buttons */}
            {isGamePage && (
              <>
                <button
                  className="game-menu-btn inventory-btn"
                  onClick={() => {
                    console.log("🎒 Dispatching showInventory event");
                    // Dispatch a custom event that GameWorld can listen for
                    window.dispatchEvent(new CustomEvent("showInventory"));
                  }}
                >
                  Inventory
                </button>
                <button
                  className="game-menu-btn quotes-btn"
                  onClick={() => {
                    console.log("📜 Dispatching showQuotes event");
                    window.dispatchEvent(new CustomEvent("showQuotes"));
                  }}
                >
                  Quotes
                </button>
              </>
            )}

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
