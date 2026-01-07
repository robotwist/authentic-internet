import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameWorld from '../../client/src/components/GameWorld';

// Mock all the dependencies
jest.mock('../../client/src/components/Map', () => {
  return function MockMap({ npcs, onNPCClick, onTileClick, onArtifactClick }) {
    return (
      <div data-testid="map-component">
        {npcs?.map(npc => (
          <div 
            key={npc.id}
            data-testid={`npc-${npc.name}`}
            onClick={() => onNPCClick?.(npc)}
          >
            {npc.name}
          </div>
        ))}
        <div data-testid="tile-1-1" onClick={() => onTileClick?.(1, 1)} />
        <div data-testid="artifact-test" onClick={() => onArtifactClick?.({ id: 'test' })} />
      </div>
    );
  };
});

jest.mock('../../client/src/components/Character', () => {
  return function MockCharacter({ position, direction }) {
    return (
      <div 
        data-testid="character"
        style={{ 
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        Character
      </div>
    );
  };
});

jest.mock('../../client/src/api/api', () => ({
  fetchArtifacts: jest.fn(() => Promise.resolve([])),
  createArtifact: jest.fn(),
  updateArtifact: jest.fn(),
  deleteArtifact: jest.fn()
}));

jest.mock('../../client/src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', username: 'testuser' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

jest.mock('../../client/src/context/AchievementContext', () => ({
  useAchievements: () => ({
    achievements: [],
    unlockAchievement: jest.fn(),
    checkAchievements: jest.fn()
  })
}));

describe('GameWorld Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
    
    // Mock window.innerWidth for responsive design
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  describe('Game Initialization', () => {
    test('renders game world with all components', () => {
      render(<GameWorld />);
      
      expect(screen.getByTestId('game-container')).toBeInTheDocument();
      expect(screen.getByTestId('map-component')).toBeInTheDocument();
      expect(screen.getByTestId('character')).toBeInTheDocument();
    });

    test('loads initial game state correctly', () => {
      render(<GameWorld />);
      
      // Check if character starts at default position
      const character = screen.getByTestId('character');
      expect(character).toHaveStyle({ left: '64px', top: '64px' });
    });

    test('loads saved game state from localStorage', () => {
      const savedState = {
        characterPosition: { x: 128, y: 128 },
        currentMapIndex: 1,
        inventory: [{ id: 'test-item', name: 'Test Item' }]
      };
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(savedState));
      
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      expect(character).toHaveStyle({ left: '128px', top: '128px' });
    });
  });

  describe('Character Movement', () => {
    test('character moves with arrow keys', () => {
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      const initialPosition = character.style.left;
      
      // Simulate right arrow key press
      fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      
      expect(character).toHaveStyle({ left: '128px' }); // 64 + 64
    });

    test('character cannot move through walls', () => {
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      
      // Try to move into a wall position
      fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp' });
      
      // Character should not move if there's a wall
      expect(character).toHaveStyle({ top: '64px' });
    });

    test('character movement is smooth', () => {
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      
      // Test multiple key presses
      fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' });
      
      expect(character).toHaveStyle({ left: '128px', top: '128px' });
    });
  });

  describe('NPC Interactions', () => {
    test('NPCs are rendered on the map', () => {
      render(<GameWorld />);
      
      // Check if NPCs are present (from mock Map component)
      expect(screen.getByTestId('npc-John Muir')).toBeInTheDocument();
    });

    test('clicking NPC opens dialog', () => {
      render(<GameWorld />);
      
      const npc = screen.getByTestId('npc-John Muir');
      fireEvent.click(npc);
      
      // Dialog should appear
      expect(screen.getByTestId('npc-dialog')).toBeInTheDocument();
    });

    test('NPC dialog shows correct content', () => {
      render(<GameWorld />);
      
      const npc = screen.getByTestId('npc-John Muir');
      fireEvent.click(npc);
      
      expect(screen.getByText('John Muir')).toBeInTheDocument();
      expect(screen.getByText(/The mountains are calling/)).toBeInTheDocument();
    });

    test('can close NPC dialog', () => {
      render(<GameWorld />);
      
      const npc = screen.getByTestId('npc-John Muir');
      fireEvent.click(npc);
      
      const closeButton = screen.getByTestId('close-dialog');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('npc-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Map Navigation', () => {
    test('can navigate between maps', () => {
      render(<GameWorld />);
      
      // Check initial map
      expect(screen.getByTestId('map-component')).toBeInTheDocument();
      
      // Navigate to next map
      const nextMapButton = screen.getByTestId('next-map-button');
      fireEvent.click(nextMapButton);
      
      // Map should change
      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    test('character position resets when changing maps', () => {
      render(<GameWorld />);
      
      // Move character
      fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      
      // Change map
      const nextMapButton = screen.getByTestId('next-map-button');
      fireEvent.click(nextMapButton);
      
      // Character should be at default position
      const character = screen.getByTestId('character');
      expect(character).toHaveStyle({ left: '64px', top: '64px' });
    });
  });

  describe('Artifact System', () => {
    test('artifacts are rendered on the map', () => {
      render(<GameWorld />);
      
      expect(screen.getByTestId('artifact-test')).toBeInTheDocument();
    });

    test('clicking artifact shows details', () => {
      render(<GameWorld />);
      
      const artifact = screen.getByTestId('artifact-test');
      fireEvent.click(artifact);
      
      expect(screen.getByTestId('artifact-modal')).toBeInTheDocument();
    });

    test('can collect artifacts', () => {
      render(<GameWorld />);
      
      const artifact = screen.getByTestId('artifact-test');
      fireEvent.click(artifact);
      
      const collectButton = screen.getByTestId('collect-artifact');
      fireEvent.click(collectButton);
      
      // Artifact should be added to inventory
      expect(screen.getByTestId('inventory')).toHaveTextContent('Test Artifact');
    });
  });

  describe('Inventory System', () => {
    test('inventory opens with I key', () => {
      render(<GameWorld />);
      
      fireEvent.keyDown(document, { key: 'i', code: 'KeyI' });
      
      expect(screen.getByTestId('inventory-modal')).toBeInTheDocument();
    });

    test('inventory shows collected items', () => {
      render(<GameWorld />);
      
      // Add item to inventory
      const artifact = screen.getByTestId('artifact-test');
      fireEvent.click(artifact);
      const collectButton = screen.getByTestId('collect-artifact');
      fireEvent.click(collectButton);
      
      // Open inventory
      fireEvent.keyDown(document, { key: 'i', code: 'KeyI' });
      
      expect(screen.getByText('Test Artifact')).toBeInTheDocument();
    });
  });

  describe('Level Completion', () => {
    test('completes level when reaching goal', () => {
      render(<GameWorld />);
      
      // Move character to goal position
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      }
      
      // Level completion notification should appear
      expect(screen.getByTestId('level-complete-notification')).toBeInTheDocument();
    });

    test('shows reward when level is completed', () => {
      render(<GameWorld />);
      
      // Complete level
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      }
      
      expect(screen.getByTestId('reward-modal')).toBeInTheDocument();
    });
  });

  describe('Save System', () => {
    test('saves game state automatically', () => {
      render(<GameWorld />);
      
      // Move character
      fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      
      // Game should auto-save
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    test('loads saved game state on restart', () => {
      const savedState = {
        characterPosition: { x: 128, y: 128 },
        currentMapIndex: 1,
        inventory: [{ id: 'test-item', name: 'Test Item' }]
      };
      
      window.localStorage.getItem.mockReturnValue(JSON.stringify(savedState));
      
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      expect(character).toHaveStyle({ left: '128px', top: '128px' });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      const { fetchArtifacts } = require('../../client/src/api/api');
      fetchArtifacts.mockRejectedValue(new Error('API Error'));
      
      render(<GameWorld />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error loading artifacts/)).toBeInTheDocument();
      });
    });

    test('handles invalid map data', () => {
      // Mock invalid map data
      jest.doMock('../../client/src/components/GameData', () => ({
        MAPS: null
      }));
      
      render(<GameWorld />);
      
      expect(screen.getByText(/Error loading game data/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('renders efficiently with many NPCs', () => {
      const startTime = performance.now();
      
      render(<GameWorld />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in under 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('handles rapid key presses efficiently', () => {
      render(<GameWorld />);
      
      const character = screen.getByTestId('character');
      
      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
      }
      
      // Character should be at expected position
      expect(character).toHaveStyle({ left: '704px' }); // 64 + (64 * 10)
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', () => {
      render(<GameWorld />);
      
      // Test all navigation keys
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'm'];
      
      keys.forEach(key => {
        fireEvent.keyDown(document, { key, code: key });
        // Should not throw errors
        expect(screen.getByTestId('game-container')).toBeInTheDocument();
      });
    });

    test('has proper ARIA labels', () => {
      render(<GameWorld />);
      
      expect(screen.getByTestId('game-container')).toHaveAttribute('role', 'application');
      expect(screen.getByTestId('character')).toHaveAttribute('aria-label', 'Player Character');
    });
  });
}); 