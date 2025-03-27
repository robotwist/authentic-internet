import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';

/**
 * Terminal component that provides an interactive command-line interface 
 * for puzzle solving and special interactions in the game.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the terminal is visible
 * @param {Function} props.onClose - Function to call when the terminal is closed
 * @param {Function} props.onComplete - Function to call when the terminal challenge is completed
 * @param {Object} props.terminalData - Data for terminal configuration (commands, responses, win conditions)
 */
const Terminal = ({ 
  isOpen = false, 
  onClose,
  onComplete,
  terminalData = {}
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    { type: 'system', content: 'Terminal v1.0.0 initialized.' },
    { type: 'system', content: 'Type "help" for available commands.' },
  ]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [user, setUser] = useState('player@authentic-internet');
  const [directory, setDirectory] = useState('~');
  const [showTip, setShowTip] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  
  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const terminalContentRef = useRef(null);
  
  // Command definitions - can be extended with terminalData.commands
  const baseCommands = {
    help: {
      description: 'Display available commands',
      action: () => {
        const availableCommands = { ...baseCommands, ...(terminalData.commands || {}) };
        const commandList = Object.entries(availableCommands)
          .map(([cmd, data]) => `  ${cmd.padEnd(10)} - ${data.description}`)
          .join('\n');
        
        return [
          { type: 'system', content: 'Available commands:' },
          { type: 'system', content: commandList }
        ];
      }
    },
    clear: {
      description: 'Clear the terminal screen',
      action: () => {
        setOutput([]);
        return [];
      }
    },
    echo: {
      description: 'Display a message',
      action: (args) => {
        return [{ type: 'system', content: args.join(' ') }];
      }
    },
    exit: {
      description: 'Exit the terminal',
      action: () => {
        if (onClose) setTimeout(onClose, 500);
        return [{ type: 'system', content: 'Exiting terminal...' }];
      }
    },
    whoami: {
      description: 'Display current user',
      action: () => {
        return [{ type: 'system', content: user.split('@')[0] }];
      }
    },
    date: {
      description: 'Display current date and time',
      action: () => {
        return [{ type: 'system', content: new Date().toString() }];
      }
    },
    pwd: {
      description: 'Print working directory',
      action: () => {
        return [{ type: 'system', content: `/home/${user.split('@')[0]}/${directory}` }];
      }
    }
  };
  
  // Combine base commands with custom commands from props
  const commands = {
    ...baseCommands,
    ...(terminalData.commands || {})
  };
  
  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
    }
  }, [output]);
  
  // Show tip after some time of inactivity
  useEffect(() => {
    if (isOpen && terminalData.tip && !showTip) {
      const timer = setTimeout(() => {
        setShowTip(true);
      }, 30000); // Show tip after 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, terminalData.tip, showTip]);
  
  // Check win conditions after each command
  useEffect(() => {
    if (terminalData.winCondition && !challengeCompleted) {
      const isComplete = terminalData.winCondition(output, history);
      
      if (isComplete) {
        setChallengeCompleted(true);
        
        // Display win message
        setOutput(prev => [
          ...prev,
          { type: 'system', content: '✅ Challenge completed!' },
          { type: 'system', content: terminalData.winMessage || 'You have successfully completed this terminal challenge.' }
        ]);
        
        // Call onComplete callback after a delay
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }
    }
  }, [output, history, terminalData, challengeCompleted, onComplete]);
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    // Handle arrow up/down for command history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      
      // Simple tab completion for commands
      const cmdStart = input.trim().split(' ')[0];
      if (cmdStart) {
        const matches = Object.keys(commands).filter(cmd => 
          cmd.startsWith(cmdStart) && cmd !== cmdStart
        );
        
        if (matches.length === 1) {
          // Complete the command if there's only one match
          setInput(matches[0] + (input.includes(' ') ? input.substring(input.indexOf(' ')) : ' '));
        } else if (matches.length > 1) {
          // Show possible completions
          setOutput(prev => [
            ...prev,
            { type: 'system', content: `Possible completions: ${matches.join(' ')}` }
          ]);
        }
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add command to output
    const commandWithPrompt = `${user}:${directory}$ ${input}`;
    setOutput(prev => [...prev, { type: 'command', content: commandWithPrompt }]);
    
    // Process command
    const parts = input.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    // Execute command if it exists
    if (commands[cmd]) {
      try {
        const result = commands[cmd].action(args);
        if (result && result.length) {
          setOutput(prev => [...prev, ...result]);
        }
      } catch (error) {
        setOutput(prev => [...prev, { 
          type: 'error', 
          content: `Error executing ${cmd}: ${error.message}` 
        }]);
      }
    } else {
      setOutput(prev => [...prev, { 
        type: 'error', 
        content: `Command not found: ${cmd}` 
      }]);
    }
    
    // Add to history
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
    setInput('');
    
    // Hide tip if shown
    if (showTip) {
      setShowTip(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="terminal-backdrop" onClick={onClose}>
      <div 
        className="terminal-window" 
        ref={terminalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="terminal-header">
          <div className="terminal-title">Terminal</div>
          <div className="terminal-controls">
            <button 
              className="terminal-close-btn" 
              onClick={onClose}
              aria-label="Close terminal"
            >×</button>
          </div>
        </div>
        
        <div className="terminal-content" ref={terminalContentRef}>
          {output.map((line, i) => (
            <div key={i} className={`terminal-line ${line.type}`}>
              {line.content}
            </div>
          ))}
          
          {showTip && terminalData.tip && (
            <div className="terminal-tip">
              <span className="tip-icon">💡</span> 
              <span className="tip-text">{terminalData.tip}</span>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <div className="terminal-prompt">{user}:{directory}$</div>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
};

export default Terminal; 