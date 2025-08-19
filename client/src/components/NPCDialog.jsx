import React, { useState, useEffect } from 'react';
import './NPCDialog.css';
import gameProgressService from '../services/GameProgressService';

/**
 * NPCDialog component for displaying dialog with NPCs in the game
 */
const NPCDialog = ({ 
  isOpen, 
  onClose, 
  npc = {}, 
  onInteract,
  character,
  onResponseSelect
}) => {
  const [dialogText, setDialogText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Initialize dialog when NPC dialog is opened
  useEffect(() => {
    if (isOpen && npc) {
      setDialogText(npc.dialog?.greeting || `Hello, I am ${npc.name}.`);
      
      // Set default responses if none provided
      if (!npc.dialog?.responses || npc.dialog.responses.length === 0) {
        setResponses([
          { id: 'default-1', text: 'Tell me about yourself.', response: `I am ${npc.name}. I'm here to help you on your journey.` },
          { id: 'default-2', text: 'What do you know about this place?', response: 'This place is full of wisdom and challenges. Explore it thoroughly.' },
          { id: 'default-3', text: 'Goodbye.', response: 'Farewell! Come back if you need assistance.', isExit: true }
        ]);
      } else {
        setResponses(npc.dialog.responses);
      }
      
      // Record interaction with NPC in game progress if logged in
      if (character?.id) {
        gameProgressService.recordNPCInteraction(npc.id);
      }
    }
  }, [isOpen, npc, character]);

  // Handle response selection
  const handleResponseClick = (response) => {
    setSelectedResponse(response);
    
    // Pass selected response to parent if callback is provided
    if (onResponseSelect) {
      onResponseSelect(response);
    }
    
    setIsLoading(true);
    
    // Simulate NPC "thinking" - could be replaced with actual API call later
    setTimeout(() => {
      setIsLoading(false);
      setDialogText(response.response || 'I understand.');
      
      // If this response grants experience, add it
      if (response.grantExperience && character?.id) {
        gameProgressService.addExperience(response.grantExperience);
        
        // Update dialog to acknowledge the experience gain
        setDialogText(prev => `${prev} (+${response.grantExperience} XP)`);
      }
      
      // If this response adds an item to inventory
      if (response.grantItem && character?.id) {
        gameProgressService.addToInventory(response.grantItem);
        
        // Update dialog to acknowledge item
        setDialogText(prev => `${prev} (Received: ${response.grantItem.name})`);
      }
      
      // If this is an exit response, close the dialog after a short delay
      if (response.isExit) {
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // If there are next responses, update them
        if (response.nextResponses) {
          setResponses(response.nextResponses);
        }
      }
      
      // If this response has a callback, execute it
      if (onInteract && response.callback) {
        onInteract(response.callback);
      }
    }, 800); // Simulate thinking time
  };

  if (!isOpen) return null;

  return (
    <div className="npc-dialog-backdrop" onClick={() => !isLoading && onClose()}>
      <div className="npc-dialog-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-dialog" onClick={() => !isLoading && onClose()}>×</button>
        
        <div className="npc-header">
          <div className="npc-avatar">
            {npc.avatar ? (
              <img src={npc.avatar} alt={npc.name} />
            ) : (
              <div>{npc.name.charAt(0)}</div>
            )}
          </div>
          <div className="npc-info">
            <h2 className="npc-name">{npc.name}</h2>
            {npc.title && <p className="npc-title">{npc.title}</p>}
          </div>
        </div>
        
        <div className="npc-dialog-content">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span className="thinking-text">{npc.name} is thinking...</span>
            </div>
          ) : (
            <div className="npc-dialog-text">{dialogText}</div>
          )}
          
          {!isLoading && (
            <div className="npc-responses">
              {responses.map((response) => (
                <button
                  key={response.id}
                  className="response-button"
                  onClick={() => handleResponseClick(response)}
                  disabled={isLoading}
                >
                  {response.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NPCDialog; 