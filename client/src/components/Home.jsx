import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Assuming you have a CSS file for styling

const Home = () => {
  return (
    <div className="home-container">
      <header>
        <h1>Authentic Internet: The Artifact World</h1>
        <p>A digital world where users explore, create, and unlock hidden artifacts.</p>
      </header>
      <nav>
        <Link to="/register" className="nav-link">Register</Link>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/game" className="nav-link">Enter Game</Link>
      </nav>
    </div>
  );
};

export default Home;