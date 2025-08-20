import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';
import { MAPS } from '../components/Constants';
import DailyQuote from '../components/DailyQuote';
import CharacterSelection from '../components/CharacterSelection';
import SkillTree from '../components/SkillTree';
import DailyChallenges from '../components/DailyChallenges';
import TitleArea from '../components/TitleArea';
import '../styles/Dashboard.css';
import { useAchievements, ACHIEVEMENTS } from '../context/AchievementContext';

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
  const [character, setCharacter] = useState(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    fetchWorlds();
    fetchCharacter();
  }, []);

  useEffect(() => {
    // Show character selection if user doesn't have a character
    if (user && !character && !showCharacterSelection) {
      setShowCharacterSelection(true);
    }
  }, [user, character, showCharacterSelection]);

  const fetchCharacter = async () => {
    if (!user?.id) return;
    
    try {
      const response = await API.get(`/api/characters/${user.id}`);
      setCharacter(response.data);
    } catch (error) {
      console.error('Failed to load character data:', error);
      // If character not found, don't show character selection yet
      // Let the useEffect handle it
    }
  };

  const handleCharacterSelected = (selectedCharacter) => {
    setCharacter(selectedCharacter);
    setShowCharacterSelection(false);
  };

  const handleCharacterSkipped = () => {
    setShowCharacterSelection(false);
  };

  // Calculate level and progress based on experience
  const calculateLevel = (exp) => {
    if (!exp && exp !== 0) return { level: 1, progress: 0, nextLevelAt: 100 };
    
    const level = exp >= 1000 ? 5 : 
                exp >= 750 ? 4 : 
                exp >= 500 ? 3 : 
                exp >= 250 ? 2 : 1;
    
    const levelThresholds = [0, 250, 500, 750, 1000];
    const currentThreshold = levelThresholds[level - 1];
    const nextThreshold = level < 5 ? levelThresholds[level] : levelThresholds[4] + 250;
    
    const progress = Math.min(100, Math.floor(((exp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
    
    return { level, progress, nextLevelAt: nextThreshold };
  };

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

  const testAchievement = () => {
    // Unlock a random achievement for testing
    const achievementKeys = Object.keys(ACHIEVEMENTS);
    const randomKey = achievementKeys[Math.floor(Math.random() * achievementKeys.length)];
    unlockAchievement(randomKey);
  };

  if (loading) return <div className="loading">Loading worlds...</div>;

  // Show character selection if needed
  if (showCharacterSelection) {
    return (
      <CharacterSelection
        onCharacterSelected={handleCharacterSelected}
        onSkip={handleCharacterSkipped}
      />
    );
  }

  // Show skill tree if needed
  if (showSkillTree) {
    return (
      <SkillTree onClose={() => setShowSkillTree(false)} />
    );
  }

  // Show daily challenges if needed
  if (showDailyChallenges) {
    return (
      <DailyChallenges onClose={() => setShowDailyChallenges(false)} />
    );
  }

  // Calculate character level and progress
  const { level, progress, nextLevelAt } = calculateLevel(character?.exp || 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <TitleArea size="medium" />
        <h1>Welcome, {user?.username}!</h1>
        {/* Daily Quote Display */}
        <div className="daily-quote-container">
          <DailyQuote />
        </div>
      </div>
      
      {/* Character Progress Section */}
      <div className="character-progress-section">
        <h2>Your Journey</h2>
        <div className="character-stats">
          <div className="character-level">
            <span className="level-label">Level</span>
            <span className="level-value">{level}</span>
          </div>
          
          <div className="experience-container">
            <div className="experience-info">
              <span>Experience: {character?.exp || 0} / {nextLevelAt}</span>
              <span>{progress}% to Level {level + 1}</span>
            </div>
            <div className="experience-bar-container">
              <div className="experience-bar" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        
                <div className="character-actions">
            <button onClick={() => navigate('/profile')}>View Profile</button>
            <button onClick={() => navigate('/game')}>Continue Adventure</button>
            <button onClick={() => setShowCharacterSelection(true)}>Change Character</button>
            <button onClick={() => setShowSkillTree(true)}>🎯 Skill Tree</button>
            <button onClick={() => setShowDailyChallenges(true)}>📅 Daily Challenges</button>
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

      <section className="dashboard-section">
        <h2>Game Features</h2>
        <div className="feature-cards">
          <div className="feature-card">
            <h3>Test Achievement</h3>
            <p>Unlock a random achievement to test the notification system.</p>
            <button onClick={testAchievement} className="primary-button">Unlock Achievement</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard; 