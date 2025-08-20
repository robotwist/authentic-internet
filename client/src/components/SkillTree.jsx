import React, { useState, useEffect } from 'react';
import { 
  SKILL_TREES, 
  calculateSkillPoints, 
  getAvailableSkills, 
  getSkillEffect,
  calculateSkillBonuses 
} from '../constants/SkillTree';
import { useAuth } from '../context/AuthContext';
import { updateUserSkills } from '../api/api';
import './SkillTree.css';

const SkillTree = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [selectedTree, setSelectedTree] = useState('explorer');
  const [userSkills, setUserSkills] = useState(user?.skills || {});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const userLevel = user?.level || 1;
  const totalSkillPoints = calculateSkillPoints(userLevel);
  const usedSkillPoints = Object.values(userSkills).reduce((sum, skill) => sum + skill.level, 0);
  const remainingPoints = totalSkillPoints - usedSkillPoints;
  const skillBonuses = calculateSkillBonuses(userSkills);

  const availableSkills = getAvailableSkills(userSkills, userLevel);

  const handleSkillUpgrade = async (skillId) => {
    if (isLoading) return;

    const skill = availableSkills.find(s => s.id === skillId);
    if (!skill || remainingPoints < skill.cost) return;

    setIsLoading(true);
    setMessage('');

    try {
      const updatedSkills = {
        ...userSkills,
        [skillId]: {
          level: (userSkills[skillId]?.level || 0) + 1,
          unlockedAt: new Date().toISOString()
        }
      };

      // Update on server
      await updateUserSkills(updatedSkills);

      // Update local state
      setUserSkills(updatedSkills);
      
      // Update user context
      updateUser({ ...user, skills: updatedSkills });

      setMessage(`✅ ${skill.name} upgraded to level ${updatedSkills[skillId].level}!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error upgrading skill:', error);
      setMessage('❌ Failed to upgrade skill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSkillNode = (skill, treeId) => {
    const currentLevel = userSkills[skill.id]?.level || 0;
    const isAvailable = availableSkills.some(s => s.id === skill.id);
    const isMaxed = currentLevel >= skill.maxLevel;
    const isUnlocked = currentLevel > 0;

    return (
      <div 
        key={skill.id}
        className={`skill-node ${isUnlocked ? 'unlocked' : ''} ${isAvailable ? 'available' : ''} ${isMaxed ? 'maxed' : ''}`}
        onClick={() => isAvailable && !isMaxed && handleSkillUpgrade(skill.id)}
      >
        <div className="skill-icon">
          {isUnlocked ? '⭐' : '🔒'}
        </div>
        <div className="skill-info">
          <h4>{skill.name}</h4>
          <p>{skill.description}</p>
          {currentLevel > 0 && (
            <div className="skill-effect">
              <strong>Effect:</strong> {getSkillEffect(skill.id, currentLevel)}
            </div>
          )}
          <div className="skill-level">
            Level: {currentLevel}/{skill.maxLevel}
          </div>
          {isAvailable && !isMaxed && (
            <div className="skill-cost">
              Cost: {skill.cost[currentLevel]} points
            </div>
          )}
        </div>
        {skill.requirements.length > 0 && (
          <div className="skill-requirements">
            <small>Requires: {skill.requirements.join(', ')}</small>
          </div>
        )}
      </div>
    );
  };

  const renderTree = (treeId) => {
    const tree = SKILL_TREES[treeId.toUpperCase()];
    if (!tree) return null;

    return (
      <div className="skill-tree">
        <div className="tree-header">
          <h2>{tree.icon} {tree.name}</h2>
          <p>{tree.description}</p>
        </div>
        
        <div className="tree-skills">
          {Object.values(tree.skills).map(skill => renderSkillNode(skill, treeId))}
        </div>
      </div>
    );
  };

  return (
    <div className="skill-tree-modal">
      <div className="skill-tree-container">
        <div className="skill-tree-header">
          <h1>🎯 Skill Tree</h1>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="skill-points-info">
          <div className="points-display">
            <span className="points-label">Skill Points:</span>
            <span className="points-value">{remainingPoints}/{totalSkillPoints}</span>
          </div>
          <div className="level-info">
            Level {userLevel} - {totalSkillPoints - usedSkillPoints} points available
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="skill-bonuses">
          <h3>Current Bonuses</h3>
          <div className="bonus-grid">
            <div className="bonus-item">
              <span className="bonus-label">Exploration:</span>
              <span className="bonus-value">+{skillBonuses.exploration}%</span>
            </div>
            <div className="bonus-item">
              <span className="bonus-label">Creation:</span>
              <span className="bonus-value">+{skillBonuses.creation}%</span>
            </div>
            <div className="bonus-item">
              <span className="bonus-label">Social:</span>
              <span className="bonus-value">+{skillBonuses.social}%</span>
            </div>
            <div className="bonus-item">
              <span className="bonus-label">Combat:</span>
              <span className="bonus-value">+{skillBonuses.combat}%</span>
            </div>
            <div className="bonus-item">
              <span className="bonus-label">Experience:</span>
              <span className="bonus-value">+{skillBonuses.experience}%</span>
            </div>
          </div>
        </div>

        <div className="tree-navigation">
          {Object.values(SKILL_TREES).map(tree => (
            <button
              key={tree.id}
              className={`tree-tab ${selectedTree === tree.id ? 'active' : ''}`}
              onClick={() => setSelectedTree(tree.id)}
              style={{ borderColor: tree.color }}
            >
              {tree.icon} {tree.name}
            </button>
          ))}
        </div>

        <div className="tree-content">
          {renderTree(selectedTree)}
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Upgrading skill...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillTree;
