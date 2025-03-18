import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shared/Layout';
import Form from '../components/shared/Form';
import Button from '../components/shared/Button';
import { fetchCharacter } from '../api/api';
import AvatarUpload from '../components/AvatarUpload';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [hasCompletedFinalDungeon, setHasCompletedFinalDungeon] = useState(false);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        if (user?.id) {
          setLoading(true);
          const characterData = await fetchCharacter(user.id);
          setCharacter(characterData);
          
          // Check if the user has completed the final dungeon
          // This could be based on a specific achievement, level, or game progress
          if (characterData.completedMaps && characterData.completedMaps.includes('final-dungeon')) {
            setHasCompletedFinalDungeon(true);
          } else if (characterData.achievements && characterData.achievements.includes('final-dungeon-completed')) {
            setHasCompletedFinalDungeon(true);
          } else if (characterData.exp >= 1000) { // Temporary condition based on experience
            setHasCompletedFinalDungeon(true);
          }
        }
      } catch (err) {
        console.error("Failed to load character data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update the user context with the new avatar
      updateProfile({ avatar: data.avatar });
      
      // Update the character state
      setCharacter(prev => ({
        ...prev,
        avatar: data.avatar
      }));
      
      setSuccess('Avatar uploaded successfully!');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Clear the preview after upload (successful or not)
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Profile updated successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleUpdateCharacter = (updatedCharacter) => {
    setCharacter(updatedCharacter);
    updateProfile({ avatar: updatedCharacter.avatar });
    setSuccess('Custom avatar uploaded successfully!');
  };

  // Calculate level and progress
  const calculateLevel = (exp) => {
    if (!exp && exp !== 0) return { level: 1, progress: 0 };
    
    const level = exp >= 1000 ? 5 : 
                 exp >= 750 ? 4 : 
                 exp >= 500 ? 3 : 
                 exp >= 250 ? 2 : 1;
    
    const levelThresholds = [0, 250, 500, 750, 1000];
    const currentThreshold = levelThresholds[level - 1];
    const nextThreshold = level < 5 ? levelThresholds[level] : levelThresholds[4] + 250;
    
    const progress = Math.min(100, Math.floor(((exp - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
    
    return { level, progress };
  };

  const getAchievements = () => {
    if (!character) return [];
    
    const achievements = [];
    
    // Level-based achievements
    const { level } = calculateLevel(character.exp || 0);
    if (level >= 2) achievements.push({ name: "Novice Explorer", description: "Reached level 2", icon: "🌱" });
    if (level >= 3) achievements.push({ name: "Seasoned Adventurer", description: "Reached level 3", icon: "🌿" });
    if (level >= 4) achievements.push({ name: "Master Traveler", description: "Reached level 4", icon: "🌳" });
    if (level >= 5) achievements.push({ name: "Legendary Hero", description: "Reached level 5", icon: "🌟" });
    
    // Inventory-based achievements
    const inventoryCount = character.inventory?.length || 0;
    if (inventoryCount >= 5) achievements.push({ name: "Collector", description: "Collected 5 artifacts", icon: "🏺" });
    if (inventoryCount >= 10) achievements.push({ name: "Treasure Hunter", description: "Collected 10 artifacts", icon: "💎" });
    
    // Quote-based achievements
    const quotesCount = character.savedQuotes?.length || 0;
    if (quotesCount >= 3) achievements.push({ name: "Scholar", description: "Saved 3 historical quotes", icon: "📜" });
    if (quotesCount >= 7) achievements.push({ name: "Historian", description: "Saved 7 historical quotes", icon: "📚" });
    
    return achievements;
  };

  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="avatar-section">
        <h3>Your Avatar</h3>
        <div className="avatar-container">
          <img 
            className="avatar-preview"
            src={avatarPreview || character?.avatar || user?.avatar || '/assets/default-avatar.svg'}
            alt="Avatar"
          />
          <div className="avatar-upload-controls">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleAvatarChange} 
              accept="image/*" 
              style={{ display: 'none' }}
            />
            <Button 
              onClick={triggerFileInput} 
              className="avatar-button"
              disabled={uploadingAvatar}
            >
              Choose Image
            </Button>
            {avatarPreview && (
              <Button 
                onClick={handleAvatarUpload} 
                className="avatar-button upload-button"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
              </Button>
            )}
          </div>
          <p className="avatar-help">Upload a JPG, PNG, GIF, or SVG (max 5MB)</p>
        </div>
      </div>

      {character && hasCompletedFinalDungeon ? (
        <div className="custom-avatar-section">
          <AvatarUpload 
            character={character} 
            onUpdateCharacter={handleUpdateCharacter} 
          />
          <div className="achievement-unlocked">
            <div className="achievement-badge">🏆</div>
            <p>You've unlocked the NKD Man Chrome Extension by completing the final dungeon!</p>
          </div>
        </div>
      ) : character ? (
        <div className="locked-feature">
          <div className="locked-icon">🔒</div>
          <p>Complete the final dungeon to unlock custom avatar uploads!</p>
          <p className="hint">Hint: Reach the final portal in the last level of the map.</p>
        </div>
      ) : null}

      <Form onSubmit={handleSubmit} className="profile-form">
        <h3>Account Settings</h3>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <h4>Change Password</h4>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
        
        <Button type="submit" className="save-button">Save Changes</Button>
      </Form>
    </div>
  );

  const renderStatsTab = () => {
    if (loading) return <div className="loading-spinner">Loading character data...</div>;
    if (!character) return <div className="no-data-message">No character data available</div>;
    
    const { level, progress } = calculateLevel(character.exp || 0);
    
    return (
      <div className="character-stats">
        <div className="stats-header">
          <div className="character-level-display">
            <img 
              src={`/assets/profile/badge-level${level >= 5 ? '5' : '1'}.svg`} 
              alt={`Level ${level} Badge`}
              className="level-badge-image"
            />
            <div className="level-badge">Level {level}</div>
            <div className="level-progress-container">
              <div 
                className="level-progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="level-progress-text">{progress}% to next level</div>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <img src="/assets/profile/badge-level1.svg" alt="Experience" className="stat-icon-image" />
            <div className="stat-name">Experience</div>
            <div className="stat-value">{character.exp || 0}</div>
          </div>
          
          <div className="stat-card">
            <img src="/assets/profile/artifact-icon.svg" alt="Artifacts" className="stat-icon-image" />
            <div className="stat-name">Artifacts</div>
            <div className="stat-value">{character.inventory?.length || 0}</div>
          </div>
          
          <div className="stat-card">
            <img src="/assets/profile/quote-icon.svg" alt="Saved Quotes" className="stat-icon-image" />
            <div className="stat-name">Saved Quotes</div>
            <div className="stat-value">{character.savedQuotes?.length || 0}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-name">Friends</div>
            <div className="stat-value">{character.friends?.length || 0}</div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          {character.savedQuotes && character.savedQuotes.length > 0 ? (
            <div className="activity-list">
              {character.savedQuotes.slice(0, 3).map((quote, index) => (
                <div key={index} className="activity-item">
                  <img src="/assets/profile/quote-icon.svg" alt="Quote" className="activity-icon-image" />
                  <div className="activity-content">
                    <div className="activity-text">Saved quote: "{quote.text.substring(0, 50)}..."</div>
                    <div className="activity-time">{new Date(quote.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-activity">No recent activity</div>
          )}
        </div>
      </div>
    );
  };

  const renderAchievementsTab = () => {
    if (loading) return <div className="loading-spinner">Loading achievements...</div>;
    
    const achievements = getAchievements();
    
    return (
      <div className="achievements-container">
        <h3>Your Achievements</h3>
        
        {achievements.length > 0 ? (
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <img src="/assets/profile/achievement-badge.svg" alt={achievement.name} className="achievement-icon-image" />
                <div className="achievement-content">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-achievements">
            <p>You haven't earned any achievements yet.</p>
            <p>Continue exploring the Authentic Internet to unlock achievements!</p>
          </div>
        )}
        
        <div className="locked-achievements">
          <h4>Locked Achievements</h4>
          <div className="achievements-grid">
            <div className="achievement-card locked">
              <div className="achievement-icon">🔒</div>
              <div className="achievement-content">
                <div className="achievement-name">Artifact Master</div>
                <div className="achievement-description">Collect 20 artifacts</div>
              </div>
            </div>
            <div className="achievement-card locked">
              <div className="achievement-icon">🔒</div>
              <div className="achievement-content">
                <div className="achievement-name">Shakespeare's Confidant</div>
                <div className="achievement-description">Save 15 Shakespeare quotes</div>
              </div>
            </div>
            <div className="achievement-card locked">
              <div className="achievement-icon">🔒</div>
              <div className="achievement-content">
                <div className="achievement-name">World Explorer</div>
                <div className="achievement-description">Visit all available worlds</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const header = (
    <div className="profile-header">
      <h1>Profile & Game Progress</h1>
      <p>Manage your account and view your adventure statistics</p>
    </div>
  );

  return (
    <Layout className="profile-container" header={header}>
      <Layout.Main className="profile-content">
        <div className="profile-info">
          <div className="profile-avatar">
            <img 
              src={character?.avatar || user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username}`} 
              alt="Profile avatar" 
            />
            {character && (
              <div className="avatar-level-badge">
                Lvl {calculateLevel(character.exp || 0).level}
              </div>
            )}
          </div>
          <div className="profile-details">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
            {character && (
              <div className="character-title">
                {character.exp >= 1000 ? "Legendary Explorer" :
                 character.exp >= 750 ? "Master Adventurer" :
                 character.exp >= 500 ? "Seasoned Traveler" :
                 character.exp >= 250 ? "Aspiring Explorer" : "Novice Adventurer"}
              </div>
            )}
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </button>
          <button 
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Game Stats
          </button>
          <button 
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
        </div>
      </Layout.Main>
    </Layout>
  );
};

export default Profile; 