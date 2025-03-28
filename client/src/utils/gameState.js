import { MAPS } from '../components/GameData';

export const saveGameState = (state) => {
  try {
    const gameState = {
      characterPosition: state.characterPosition,
      currentMapIndex: state.currentMapIndex,
      inventory: state.inventory,
      userArtifacts: state.userArtifacts,
      modifiedArtifacts: state.modifiedArtifacts,
      exp: state.exp,
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem('gameState', JSON.stringify(gameState));
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
};

export const loadGameState = () => {
  try {
    const savedState = localStorage.getItem('gameState');
    if (!savedState) return null;

    const gameState = JSON.parse(savedState);
    
    // Validate and sanitize loaded data
    if (!validateGameState(gameState)) {
      throw new Error('Invalid game state data');
    }

    return gameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};

export const validateGameState = (state) => {
  // Basic validation checks
  if (!state) return false;

  const requiredFields = [
    'characterPosition',
    'currentMapIndex',
    'inventory',
    'userArtifacts',
    'modifiedArtifacts',
    'exp'
  ];

  const hasAllFields = requiredFields.every(field => state.hasOwnProperty(field));
  if (!hasAllFields) return false;

  // Validate character position
  if (!state.characterPosition?.x || !state.characterPosition?.y) return false;

  // Validate map index
  if (state.currentMapIndex < 0 || state.currentMapIndex >= MAPS.length) return false;

  return true;
};

export const mergeArtifacts = (mapArtifacts, userArtifacts, modifiedArtifacts) => {
  console.log('Merging artifacts:', { 
    mapArtifacts: mapArtifacts?.map(a => ({ id: a.id, name: a.name, location: a.location })),
    userArtifacts: userArtifacts?.map(a => ({ id: a.id, name: a.name, location: a.location })),
    modifiedArtifacts: modifiedArtifacts?.map(a => ({ id: a.id, name: a.name, location: a.location }))
  });

  // Start with the original map artifacts
  const artifacts = [...(mapArtifacts || [])].map(artifact => ({
    ...artifact,
    location: artifact.location || { x: artifact.x, y: artifact.y }
  }));

  // Apply any modifications from modifiedArtifacts
  (modifiedArtifacts || []).forEach(modifiedArtifact => {
    const index = artifacts.findIndex(a => a.id === modifiedArtifact.id);
    if (index !== -1) {
      artifacts[index] = { 
        ...artifacts[index], 
        ...modifiedArtifact,
        location: modifiedArtifact.location || artifacts[index].location
      };
    }
  });

  // Add user-created artifacts
  (userArtifacts || []).forEach(userArtifact => {
    if (!artifacts.find(a => a.id === userArtifact.id)) {
      artifacts.push({
        ...userArtifact,
        location: userArtifact.location || { x: userArtifact.x, y: userArtifact.y }
      });
    }
  });

  console.log('Merged artifacts:', artifacts.map(a => ({ 
    id: a.id, 
    name: a.name, 
    location: a.location 
  })));

  return artifacts;
};

export const createUserArtifact = (data) => {
  return {
    id: crypto.randomUUID(),
    visible: true,
    userCreated: true,
    createdAt: new Date().toISOString(),
    ...data
  };
};

export const updateArtifact = (artifact, updates, userModifiable) => {
  // Only allow updates to modifiable properties
  const allowedUpdates = {};
  
  if (userModifiable.description) allowedUpdates.description = updates.description;
  if (userModifiable.content) allowedUpdates.content = updates.content;
  if (userModifiable.riddle) allowedUpdates.riddle = updates.riddle;
  if (userModifiable.unlockAnswer) allowedUpdates.unlockAnswer = updates.unlockAnswer;
  
  if (userModifiable.properties) {
    allowedUpdates.properties = { ...artifact.properties };
    userModifiable.properties.forEach(prop => {
      if (updates.properties?.[prop] !== undefined) {
        allowedUpdates.properties[prop] = updates.properties[prop];
      }
    });
  }

  return {
    ...artifact,
    ...allowedUpdates,
    lastModified: new Date().toISOString()
  };
}; 