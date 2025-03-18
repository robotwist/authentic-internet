import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import { MAPS } from '../components/Constants';
import DailyQuote from '../components/DailyQuote';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [mainWorld, setMainWorld] = useState(null);
  const [devWorlds, setDevWorlds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorld, setNewWorld] = useState({
    name: '',
    description: '',
    mapType: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      setLoading(true);
      setError('');

      // Set up the main world data from our Constants
      const mainWorldData = {
        _id: 'main-world',
        name: 'Authentic Internet',
        description: 'The main world where all users can interact and explore together.',
        isMainWorld: true,
        mapData: MAPS[0], // Use the first map from Constants.jsx as the main world
        artifacts: MAPS[0].artifacts,
        npcs: [] // We'll populate this later
      };

      setMainWorld(mainWorldData);

      // Fetch user's development worlds
      const devWorldsResponse = await API.get('/api/worlds/my-worlds');
      const devWorldsList = Array.isArray(devWorldsResponse.data) 
        ? devWorldsResponse.data.filter(world => !world.isMainWorld)
        : [];
      setDevWorlds(devWorldsList);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load worlds:', error);
      setError('Failed to load worlds');
      setLoading(false);
    }
  };

  const handleCreateWorld = async (e) => {
    e.preventDefault();

    // Validate form data
    if (newWorld.name.length < 3) {
      setError('World name must be at least 3 characters long');
      return;
    }
    if (newWorld.description.length < 10) {
      setError('World description must be at least 10 characters long');
      return;
    }

    try {
      setError('');
      const response = await API.post('/api/worlds', {
        ...newWorld,
        isMainWorld: false // Ensure new worlds are always development worlds
      });
      
      if (response.data.world) {
        setDevWorlds(prevWorlds => [...prevWorlds, response.data.world]);
        setShowCreateForm(false);
        setNewWorld({
          name: '',
          description: '',
          mapType: ''
        });
      }
    } catch (error) {
      console.error('Failed to create world:', error);
      setError(error.response?.data?.message || 'Failed to create world');
    }
  };

  const handleWorldClick = (worldId) => {
    if (worldId === 'main-world') {
      // Navigate to the GameWorld component for the main world
      navigate('/game');
    } else {
      // For development worlds, use the regular world route
      navigate(`/world/${worldId}`);
    }
  };

  if (loading) return <div className="loading">Loading worlds...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}!</h1>
        {/* Daily Quote Display */}
        <div className="daily-quote-container">
          <DailyQuote />
        </div>
      </div>
      
      <div className="main-world-section">
        <h2>The Main World</h2>
        <p>Welcome to Authentic Internet - the shared world where all users can interact and explore together.</p>
        {mainWorld ? (
          <div 
            className="world-card main" 
            onClick={() => handleWorldClick('main-world')}
            role="button"
            tabIndex={0}
          >
            <h3>{mainWorld.name}</h3>
            <p>{mainWorld.description}</p>
            <div className="world-stats">
              <span>{mainWorld.mapData.artifacts.length} Artifacts</span>
              <span>{mainWorld.npcs?.length || 0} NPCs</span>
            </div>
            <div className="world-status main">
              Main World - Click to Enter Game
            </div>
          </div>
        ) : (
          <div className="error">Main world is not available. Please try refreshing the page.</div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="development-worlds">
        <div className="section-header">
          <h2>Development Worlds</h2>
          <button onClick={() => setShowCreateForm(true)}>Create New World</button>
        </div>
        <p>Create and test your worlds here before making them accessible in the main world.</p>
        
        <div className="worlds-grid">
          {devWorlds.length > 0 ? (
            devWorlds.map(world => (
              <div 
                key={world._id} 
                className="world-card dev" 
                onClick={() => handleWorldClick(world._id)}
                role="button"
                tabIndex={0}
              >
                <h3>{world.name}</h3>
                <p>{world.description}</p>
                <div className="world-stats">
                  <span>{world.games?.length || 0} Games</span>
                  <span>{world.npcs?.length || 0} NPCs</span>
                  <span>{world.artifacts?.length || 0} Artifacts</span>
                </div>
                <div className="world-status">
                  {world.isPublic ? 'Public' : 'Private'} Development World
                </div>
              </div>
            ))
          ) : (
            <p className="no-worlds">No development worlds yet. Create one to get started!</p>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create Development World</h2>
            <form onSubmit={handleCreateWorld}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newWorld.name}
                  onChange={(e) => setNewWorld({ ...newWorld, name: e.target.value })}
                  required
                  minLength={3}
                  placeholder="Enter world name (min. 3 characters)"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={newWorld.description}
                  onChange={(e) => setNewWorld({ ...newWorld, description: e.target.value })}
                  required
                  minLength={10}
                  placeholder="Enter world description (min. 10 characters)"
                />
              </div>
              <div className="form-group">
                <label>Map Type:</label>
                <select
                  value={newWorld.mapType}
                  onChange={(e) => setNewWorld({ ...newWorld, mapType: e.target.value })}
                  required
                >
                  <option value="">Select a map type</option>
                  {Object.keys(MAPS).map(mapKey => (
                    <option key={mapKey} value={mapKey}>
                      {MAPS[mapKey].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit">Create World</button>
                <button type="button" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 