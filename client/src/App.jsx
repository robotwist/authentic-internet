import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import World from './pages/World';
import Profile from './pages/Profile';
import CreateWorld from './pages/CreateWorld';
import GameWorld from './components/GameWorld';
import TestPage from './pages/TestPage';
import ArtifactsPage from './pages/ArtifactsPage';
import ErrorBoundary from './components/ErrorBoundary';
import errorMonitor from './utils/errorMonitor';
import deploymentVerifier from './utils/deploymentVerifier';
import { logBuildInfo } from './buildInfo';
import DeploymentStatus from './components/DeploymentStatus';
import TextAdventure from './components/TextAdventure';
import './App.css';

// Configure future flags for React Router v7
const routerOptions = {
  future: {
    v7_startTransition: true
  }
};

function App() {
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [showDeploymentStatus, setShowDeploymentStatus] = useState(false);
  const [world, setWorld] = useState('desert1');
  const [user, setUser] = useState(null);

  // Initialize error monitor and log build info
  useEffect(() => {
    // Log build information for version tracking
    logBuildInfo();
    
    // Verify deployment is current with GitHub
    const checkDeployment = async () => {
      try {
        const result = await deploymentVerifier.verifyDeployment('robotwist', 'authentic-internet');
        setDeploymentStatus(result);
      } catch (error) {
        console.error('Error checking deployment status:', error);
      }
    };
    
    // Check immediately and then every 10 minutes
    checkDeployment();
    const interval = setInterval(checkDeployment, 10 * 60 * 1000);
    
    // Start the error monitor
    errorMonitor.start();
    
    // Add keyboard shortcut to toggle the error monitor (Alt+E)
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'e') {
        if (errorMonitor.isActive) {
          errorMonitor.stop();
        } else {
          errorMonitor.start();
        }
      }
      
      // Add keyboard shortcut to check deployment status (Alt+D)
      if (e.altKey && e.key === 'd') {
        checkDeployment();
        setShowDeploymentStatus(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      errorMonitor.stop();
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const handleWorldChange = (worldId) => {
    // ... existing code ...
    
    // Add handling for Hemingway's Adventure and Text Adventure
    if (worldId === 'hemingway') {
      return <Level4Shooter onComplete={() => setWorld('desert1')} onExit={() => setWorld('desert1')} />;
    }
    
    if (worldId === 'text_adventure') {
      return <TextAdventure 
        username={user?.username || 'traveler'}
        onComplete={() => setWorld('dungeon3')} 
        onExit={() => setWorld('dungeon3')} 
      />;
    }
    
    // ... existing code ...
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router {...routerOptions}>
          <div className="app">
            <Navbar />
            {showDeploymentStatus && (
              <div style={{ 
                position: 'fixed', 
                bottom: '10px', 
                right: '10px', 
                zIndex: 1000,
                maxWidth: '350px'
              }}>
                <DeploymentStatus status={deploymentStatus} />
              </div>
            )}
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worlds/create"
                  element={
                    <ProtectedRoute>
                      <CreateWorld />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/world/:id"
                  element={
                    <ProtectedRoute>
                      <World />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artifacts"
                  element={
                    <ProtectedRoute>
                      <ArtifactsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artifacts/:id"
                  element={
                    <ProtectedRoute>
                      <ArtifactsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game"
                  element={
                    <ProtectedRoute>
                      <GameWorld />
                    </ProtectedRoute>
                  }
                />
                <Route path="/test" element={<TestPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
