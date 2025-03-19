import React from 'react';
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
import PrivateRoute from './components/PrivateRoute';
import TestPage from './pages/TestPage';
import ArtifactsPage from './pages/ArtifactsPage';
import './App.css';

// Configure future flags for React Router v7
const routerOptions = {
  future: {
    v7_startTransition: true
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router {...routerOptions}>
          <div className="app">
            <Navbar />
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
