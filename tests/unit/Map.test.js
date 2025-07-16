import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Map from '../../client/src/components/Map';
import { NPC_TYPES } from '../../client/src/components/GameConstants';

// Mock the Constants module
jest.mock('../../client/src/components/Constants', () => ({
  TILE_SIZE: 64
}));

// Mock the Tile and Artifact components
jest.mock('../../client/src/components/Tile', () => {
  return function MockTile({ x, y, onClick }) {
    return (
      <div 
        data-testid={`tile-${x}-${y}`}
        onClick={() => onClick && onClick(x, y)}
        style={{ width: '64px', height: '64px' }}
      />
    );
  };
});

jest.mock('../../client/src/components/Artifact', () => {
  return function MockArtifact({ artifact, onInteract }) {
    return (
      <div 
        data-testid={`artifact-${artifact.name}`}
        onClick={onInteract}
        style={{ 
          position: 'absolute',
          left: `${artifact.location.x * 64}px`,
          top: `${artifact.location.y * 64}px`
        }}
      >
        {artifact.name}
      </div>
    );
  };
});

describe('Map Component', () => {
  const mockMapData = [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1]
  ];

  const mockNPCs = [
    {
      id: 'test-npc-1',
      name: 'John Muir',
      type: NPC_TYPES.JOHN_MUIR,
      position: { x: 1, y: 1 },
      dialogue: ['Test dialogue']
    },
    {
      id: 'test-npc-2',
      name: 'William Shakespeare',
      type: NPC_TYPES.SHAKESPEARE,
      position: { x: 2, y: 0 },
      dialogue: ['Test dialogue 2']
    }
  ];

  const mockArtifacts = [
    {
      id: 'test-artifact-1',
      name: 'Ancient Sword',
      location: { x: 0, y: 1 }
    }
  ];

  const defaultProps = {
    mapData: mockMapData,
    npcs: mockNPCs,
    artifacts: mockArtifacts,
    onTileClick: jest.fn(),
    onNPCClick: jest.fn(),
    onArtifactClick: jest.fn(),
    mapName: 'Test Map'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NPC Rendering', () => {
    test('renders all NPCs with correct positions', () => {
      render(<Map {...defaultProps} />);
      
      // Check if NPCs are rendered
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      expect(npcSprites).toHaveLength(2);
      
      // Check NPC positions
      const johnMuir = screen.getByTestId('npc-sprite-john-muir-1-1');
      const shakespeare = screen.getByTestId('npc-sprite-william-shakespeare-2-0');
      
      expect(johnMuir).toBeInTheDocument();
      expect(shakespeare).toBeInTheDocument();
    });

    test('renders NPCs with correct sprite URLs', () => {
      render(<Map {...defaultProps} />);
      
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      
      // Check that NPCs have background images
      npcSprites.forEach(npc => {
        const style = window.getComputedStyle(npc);
        expect(style.backgroundImage).not.toBe('none');
      });
    });

    test('renders NPCs with correct styling', () => {
      render(<Map {...defaultProps} />);
      
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      
      npcSprites.forEach(npc => {
        const style = window.getComputedStyle(npc);
        expect(style.position).toBe('absolute');
        expect(style.width).toBe('64px');
        expect(style.height).toBe('64px');
        expect(style.cursor).toBe('pointer');
        expect(style.zIndex).toBe('20');
      });
    });

    test('renders NPC name labels', () => {
      render(<Map {...defaultProps} />);
      
      expect(screen.getByText('John Muir')).toBeInTheDocument();
      expect(screen.getByText('William Shakespeare')).toBeInTheDocument();
    });

    test('renders NPC interaction indicators', () => {
      render(<Map {...defaultProps} />);
      
      const indicators = screen.getAllByText('Press \'T\' to talk');
      expect(indicators).toHaveLength(2);
    });

    test('handles NPC clicks correctly', () => {
      render(<Map {...defaultProps} />);
      
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      fireEvent.click(npcSprites[0]);
      
      expect(defaultProps.onNPCClick).toHaveBeenCalledWith(mockNPCs[0]);
    });

    test('handles empty NPC array', () => {
      render(<Map {...defaultProps} npcs={[]} />);
      
      const npcSprites = screen.queryAllByTestId(/npc-sprite/);
      expect(npcSprites).toHaveLength(0);
    });

    test('handles null NPC array', () => {
      render(<Map {...defaultProps} npcs={null} />);
      
      const npcSprites = screen.queryAllByTestId(/npc-sprite/);
      expect(npcSprites).toHaveLength(0);
    });

    test('filters out NPCs without positions', () => {
      const npcsWithInvalidPosition = [
        ...mockNPCs,
        {
          id: 'invalid-npc',
          name: 'Invalid NPC',
          type: NPC_TYPES.GUIDE,
          position: null,
          dialogue: ['Test']
        }
      ];
      
      render(<Map {...defaultProps} npcs={npcsWithInvalidPosition} />);
      
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      expect(npcSprites).toHaveLength(2); // Only valid NPCs
    });

    test('uses fallback sprite for unknown NPC types', () => {
      const npcWithUnknownType = [
        {
          id: 'unknown-npc',
          name: 'Unknown NPC',
          type: 'UNKNOWN_TYPE',
          position: { x: 0, y: 0 },
          dialogue: ['Test']
        }
      ];
      
      render(<Map {...defaultProps} npcs={npcWithUnknownType} />);
      
      const npcSprite = screen.getByTestId(/npc-sprite/);
      expect(npcSprite).toBeInTheDocument();
    });
  });

  describe('Map Rendering', () => {
    test('renders map tiles correctly', () => {
      render(<Map {...defaultProps} />);
      
      // Check if tiles are rendered for each cell
      expect(screen.getByTestId('tile-0-0')).toBeInTheDocument();
      expect(screen.getByTestId('tile-1-0')).toBeInTheDocument();
      expect(screen.getByTestId('tile-2-0')).toBeInTheDocument();
      expect(screen.getByTestId('tile-0-1')).toBeInTheDocument();
      expect(screen.getByTestId('tile-1-1')).toBeInTheDocument();
      expect(screen.getByTestId('tile-2-1')).toBeInTheDocument();
      expect(screen.getByTestId('tile-0-2')).toBeInTheDocument();
      expect(screen.getByTestId('tile-1-2')).toBeInTheDocument();
      expect(screen.getByTestId('tile-2-2')).toBeInTheDocument();
    });

    test('handles tile clicks correctly', () => {
      render(<Map {...defaultProps} />);
      
      const tile = screen.getByTestId('tile-1-1');
      fireEvent.click(tile);
      
      expect(defaultProps.onTileClick).toHaveBeenCalledWith(1, 1);
    });

    test('handles invalid map data', () => {
      render(<Map {...defaultProps} mapData={null} />);
      
      expect(screen.getByText('Error: Invalid map data')).toBeInTheDocument();
    });

    test('handles empty map data', () => {
      render(<Map {...defaultProps} mapData={[]} />);
      
      expect(screen.getByText('Error: Invalid map data')).toBeInTheDocument();
    });
  });

  describe('Artifact Rendering', () => {
    test('renders artifacts correctly', () => {
      render(<Map {...defaultProps} />);
      
      expect(screen.getByTestId('artifact-Ancient Sword')).toBeInTheDocument();
    });

    test('handles artifact clicks correctly', () => {
      render(<Map {...defaultProps} />);
      
      const artifact = screen.getByTestId('artifact-Ancient Sword');
      fireEvent.click(artifact);
      
      expect(defaultProps.onArtifactClick).toHaveBeenCalledWith(mockArtifacts[0]);
    });

    test('handles empty artifact array', () => {
      render(<Map {...defaultProps} artifacts={[]} />);
      
      expect(screen.queryByTestId(/artifact-/)).not.toBeInTheDocument();
    });
  });

  describe('Map Interactions', () => {
    test('handles mouse drag events', () => {
      render(<Map {...defaultProps} />);
      
      const map = screen.getByTestId('map');
      
      fireEvent.mouseDown(map, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(map, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(map);
      
      // The map should handle these events without errors
      expect(map).toBeInTheDocument();
    });

    test('handles wheel events for zoom', () => {
      const onZoomChange = jest.fn();
      render(<Map {...defaultProps} onZoomChange={onZoomChange} />);
      
      const map = screen.getByTestId('map');
      
      fireEvent.wheel(map, { deltaY: 100 });
      
      expect(onZoomChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('NPCs have proper data attributes', () => {
      render(<Map {...defaultProps} />);
      
      const npcSprites = screen.getAllByTestId(/npc-sprite/);
      
      npcSprites.forEach(npc => {
        expect(npc).toHaveAttribute('data-npc-type');
      });
    });

    test('map has proper data attributes', () => {
      render(<Map {...defaultProps} />);
      
      const map = screen.getByTestId('map');
      expect(map).toHaveAttribute('data-map-name', 'Test Map');
    });
  });
}); 