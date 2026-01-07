import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NPC from '../../client/src/components/NPC';
import { NPC_TYPES } from '../../client/src/components/GameConstants';

// Mock the API module
jest.mock('../../client/src/api/api', () => ({
  chat: jest.fn(),
  updateCharacter: jest.fn()
}));

// Mock the Constants module
jest.mock('../../client/src/components/Constants', () => ({
  TILE_SIZE: 64,
  NPC_TYPES: {
    SHAKESPEARE: 'shakespeare',
    JOHN_MUIR: 'john_muir',
    ZEUS: 'zeus'
  },
  isWalkable: jest.fn(() => true)
}));

describe('NPC Component', () => {
  const mockNPC = {
    id: 'test-npc-1',
    name: 'John Muir',
    type: NPC_TYPES.JOHN_MUIR,
    position: { x: 64, y: 64 },
    dialogue: [
      'The mountains are calling and I must go.',
      'In every walk with nature one receives far more than he seeks.'
    ]
  };

  const mockPosition = { x: 64, y: 64 };
  const mockCharacterPosition = { x: 128, y: 128 };
  const mockMapData = [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1]
  ];

  const defaultProps = {
    npc: mockNPC,
    position: mockPosition,
    characterPosition: mockCharacterPosition,
    onDialogStateChange: jest.fn(),
    mapData: mockMapData,
    character: null,
    onUpdateCharacter: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NPC Rendering', () => {
    test('renders NPC with correct styling', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      expect(npcElement).toBeInTheDocument();
      
      const style = window.getComputedStyle(npcElement);
      expect(style.position).toBe('absolute');
      expect(style.width).toBe('64px');
      expect(style.height).toBe('64px');
      expect(style.cursor).toBe('pointer');
    });

    test('renders NPC with correct background image', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      const style = window.getComputedStyle(npcElement);
      expect(style.backgroundImage).toContain('john_muir.png');
    });

    test('renders NPC with correct data attributes', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      expect(npcElement).toHaveAttribute('data-type', 'john_muir');
    });

    test('renders NPC with patrolling class when patrolling', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      expect(npcElement).toHaveClass('patrolling');
    });
  });

  describe('NPC Interaction', () => {
    test('opens dialog when NPC is clicked within range', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
      expect(screen.getByText('John Muir')).toBeInTheDocument();
    });

    test('does not open dialog when NPC is clicked outside range', () => {
      const farCharacterPosition = { x: 500, y: 500 };
      render(<NPC {...defaultProps} characterPosition={farCharacterPosition} />);
      
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      expect(screen.queryByTestId('dialog-overlay')).not.toBeInTheDocument();
    });

    test('calls onDialogStateChange when dialog opens', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      expect(defaultProps.onDialogStateChange).toHaveBeenCalledWith(true);
    });

    test('displays greeting message when dialog opens', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      expect(screen.getByText(/The mountains are calling/)).toBeInTheDocument();
    });
  });

  describe('Dialog Functionality', () => {
    test('closes dialog when close button is clicked', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      // Close dialog
      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId('dialog-overlay')).not.toBeInTheDocument();
      expect(defaultProps.onDialogStateChange).toHaveBeenCalledWith(false);
    });

    test('closes dialog when clicking outside dialog', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      // Click outside dialog
      const dialogOverlay = screen.getByTestId('dialog-overlay');
      fireEvent.click(dialogOverlay);
      
      expect(screen.queryByTestId('dialog-overlay')).not.toBeInTheDocument();
    });

    test('displays typing indicator when processing', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      // Simulate typing state
      const typingIndicator = screen.getByTestId('typing-indicator');
      expect(typingIndicator).toBeInTheDocument();
    });
  });

  describe('NPC Movement', () => {
    test('NPC moves randomly when patrolling', async () => {
      jest.useFakeTimers();
      
      render(<NPC {...defaultProps} />);
      
      const initialPosition = screen.getByTestId('npc-element').style.left;
      
      // Fast-forward time to trigger movement
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        const newPosition = screen.getByTestId('npc-element').style.left;
        expect(newPosition).not.toBe(initialPosition);
      });
      
      jest.useRealTimers();
    });

    test('NPC stops patrolling when in dialog', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      // NPC should not have patrolling class
      expect(npcElement).not.toHaveClass('patrolling');
    });
  });

  describe('Quote Saving', () => {
    test('displays save quote button for NPC messages', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const saveButton = screen.getByTestId('save-quote-button');
      expect(saveButton).toBeInTheDocument();
    });

    test('saves quote when save button is clicked', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const saveButton = screen.getByTestId('save-quote-button');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onUpdateCharacter).toHaveBeenCalled();
    });

    test('shows saved state for already saved quotes', () => {
      const characterWithSavedQuotes = {
        savedQuotes: [
          { text: 'The mountains are calling and I must go.' }
        ]
      };
      
      render(<NPC {...defaultProps} character={characterWithSavedQuotes} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const saveButton = screen.getByTestId('save-quote-button');
      expect(saveButton).toHaveTextContent('✓ Saved');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Mobile Support', () => {
    test('handles mobile keyboard visibility', () => {
      // Mock mobile detection
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.focus(input);
      
      const dialogOverlay = screen.getByTestId('dialog-overlay');
      expect(dialogOverlay).toHaveClass('keyboard-open');
    });

    test('provides haptic feedback on mobile', () => {
      // Mock vibrate API
      Object.defineProperty(navigator, 'vibrate', {
        value: jest.fn(),
        configurable: true
      });
      
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      expect(navigator.vibrate).toHaveBeenCalledWith(50);
    });
  });

  describe('Error Handling', () => {
    test('handles missing NPC data gracefully', () => {
      render(<NPC {...defaultProps} npc={null} />);
      
      expect(screen.queryByTestId('npc-element')).not.toBeInTheDocument();
    });

    test('handles missing position data gracefully', () => {
      const npcWithoutPosition = { ...mockNPC, position: null };
      render(<NPC {...defaultProps} npc={npcWithoutPosition} />);
      
      expect(screen.queryByTestId('npc-element')).not.toBeInTheDocument();
    });

    test('handles API errors gracefully', async () => {
      const { chat } = require('../../client/src/api/api');
      chat.mockRejectedValue(new Error('API Error'));
      
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/Error occurred/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('NPC has proper ARIA attributes', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      expect(npcElement).toHaveAttribute('role', 'button');
      expect(npcElement).toHaveAttribute('aria-label', 'Talk to John Muir');
    });

    test('dialog has proper ARIA attributes', () => {
      render(<NPC {...defaultProps} />);
      
      // Open dialog
      const npcElement = screen.getByTestId('npc-element');
      fireEvent.click(npcElement);
      
      const dialog = screen.getByTestId('dialog-overlay');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    });

    test('supports keyboard navigation', () => {
      render(<NPC {...defaultProps} />);
      
      const npcElement = screen.getByTestId('npc-element');
      
      // Test Enter key
      fireEvent.keyPress(npcElement, { key: 'Enter', code: 'Enter' });
      expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
      
      // Test Space key
      fireEvent.keyPress(npcElement, { key: ' ', code: 'Space' });
      expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    });
  });
}); 