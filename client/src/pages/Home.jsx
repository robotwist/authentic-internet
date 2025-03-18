import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import Button from '../components/shared/Button';
import '../styles/Home.css';

const Home = () => {
  const { user } = useAuth();

  const header = (
    <div className="home-header">
      <h1>Welcome to Authentic Internet</h1>
      <p className="subtitle">Your journey through philosophical worlds begins here</p>
    </div>
  );

  const content = user ? (
    <div className="authenticated-content">
      <h2>Your Worlds</h2>
      <div className="worlds-grid">
        {/* We'll add the worlds list here later */}
        <p>Your worlds will appear here...</p>
      </div>
      
      <div className="action-buttons">
        <Button as={Link} to="/worlds/create" variant="primary">
          Create New World
        </Button>
        <Button as={Link} to="/dashboard" variant="secondary">
          Go to Dashboard
        </Button>
      </div>
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
  );

  return (
    <Layout className="home-container">
      <Layout.Header>{header}</Layout.Header>
      <Layout.Main className="home-content">
        {content}
      </Layout.Main>
    </Layout>
  );
};

export default Home; 