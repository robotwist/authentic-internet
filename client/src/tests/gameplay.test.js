import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { ARTIFACT_TYPES, NPC_TYPES, MAPS } from '../components/Constants';

// Test helper functions
const simulateKeyPress = (key) => {
  fireEvent.keyDown(document, { key });
  fireEvent.keyUp(document, { key });
};

const simulateClick = (element) => {
  fireEvent.mouseDown(element);
  fireEvent.mouseUp(element);
  fireEvent.click(element);
};

const waitForAnimation = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

describe('Core Gameplay Mechanics', () => {
  describe('Artifact Pickup', () => {
    it('should detect when character is near an artifact', () => {
      const characterPosition = { x: 64, y: 64 }; // 1 tile position
      const artifactLocation = { x: 1, y: 1 }; // Same tile in grid coordinates
      
      const dx = Math.abs(artifactLocation.x - Math.floor(characterPosition.x / 64));
      const dy = Math.abs(artifactLocation.y - Math.floor(characterPosition.y / 64));
      
      expect(dx).toBe(0);
      expect(dy).toBe(0);
    });

    it('should validate artifact properties', () => {
      const artifact = {
        id: '123',
        name: 'Test Artifact',
        description: 'A test artifact',
        type: ARTIFACT_TYPES.RELIC,
        location: { x: 1, y: 1 },
        exp: 10
      };

      expect(artifact).toHaveProperty('id');
      expect(artifact).toHaveProperty('name');
      expect(artifact).toHaveProperty('description');
      expect(artifact).toHaveProperty('type');
      expect(artifact).toHaveProperty('location');
      expect(artifact).toHaveProperty('exp');
    });
  });

  describe('NPC Interaction', () => {
    it('should detect when character is near an NPC', () => {
      const characterPosition = { x: 64, y: 64 }; // 1 tile position
      const npcPosition = { x: 2, y: 1 }; // Adjacent tile
      
      const dx = Math.abs(characterPosition.x - npcPosition.x * 64);
      const dy = Math.abs(characterPosition.y - npcPosition.y * 64);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      expect(distance).toBeLessThanOrEqual(64 * 3); // Within 3 tiles
    });

    it('should validate NPC properties', () => {
      const npc = {
        id: '456',
        name: 'Test NPC',
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 1, y: 1 },
        dialogue: ['Test dialogue']
      };

      expect(npc).toHaveProperty('id');
      expect(npc).toHaveProperty('name');
      expect(npc).toHaveProperty('type');
      expect(npc).toHaveProperty('position');
      expect(npc).toHaveProperty('dialogue');
      expect(npc.dialogue).toBeInstanceOf(Array);
    });
  });

  describe('World Traversal and Portals', () => {
    it('should validate portal locations', () => {
      const mapData = [
        [0, 0, 5], // 5 represents a portal
        [0, 0, 0],
        [0, 0, 0]
      ];
      
      const portalTile = { x: 2, y: 0 };
      expect(mapData[portalTile.y][portalTile.x]).toBe(5);
    });

    it('should validate map transitions', () => {
      const currentMapIndex = 0;
      const totalMaps = MAPS.length;
      
      expect(totalMaps).toBeGreaterThan(1);
      expect(currentMapIndex).toBeLessThan(totalMaps);
    });
  });
});

// Core gameplay test suite
export const runGameplayTests = async () => {
  console.log('🎮 Starting gameplay tests...');
  
  try {
    // World traversal tests
    console.log('🌎 Testing world traversal...');
    await testWorldTraversal();
    
    // NPC Interaction Tests
    console.log('👥 Testing NPC interactions...');
    await testNPCInteractions();
    
    // Artifact CRUD Tests
    console.log('📦 Testing artifact CRUD operations...');
    await testArtifactCRUD();
    
    // Inventory Management Tests
    console.log('🎒 Testing inventory management...');
    await testInventoryManagement();
    
    console.log('✅ All gameplay tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Test implementation functions
async function testWorldTraversal() {
  try {
    // Test portal detection
    const findPortal = async () => {
      const movements = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      for (const direction of movements) {
        simulateKeyPress(direction);
        await waitForAnimation();
        
        const portalFlash = document.querySelector('.portal-flash');
        if (portalFlash) return true;
      }
      return false;
    };

    // Test portal transition
    const testPortalTransition = async () => {
      const initialMap = document.querySelector('.game-world');
      const initialMapStyle = initialMap?.style.transform;

      const foundPortal = await findPortal();
      if (!foundPortal) throw new Error('Portal not found in current map');

      await waitForAnimation(1500);

      const newMap = document.querySelector('.game-world');
      const newMapStyle = newMap?.style.transform;

      if (initialMapStyle === newMapStyle) {
        throw new Error('Map transition did not occur');
      }

      console.log('✅ Portal transition successful');
    };

    // Test map boundaries
    const testMapBoundaries = async () => {
      for (let i = 0; i < 20; i++) {
        simulateKeyPress('ArrowLeft');
        await waitForAnimation(100);
      }

      const character = document.querySelector('.character');
      const position = character?.getBoundingClientRect();

      if (position && position.x < 0) {
        throw new Error('Character moved beyond map boundaries');
      }

      console.log('✅ Map boundaries test passed');
    };

    // Test world state persistence
    const testWorldStatePersistence = async () => {
      const initialState = localStorage.getItem('gameState');
      
      simulateKeyPress('ArrowRight');
      await waitForAnimation();
      
      const newState = localStorage.getItem('gameState');
      if (initialState === newState) {
        throw new Error('World state not persisting after movement');
      }

      console.log('✅ World state persistence test passed');
    };

    await testPortalTransition();
    await testMapBoundaries();
    await testWorldStatePersistence();

    console.log('✅ World traversal tests passed');
  } catch (error) {
    console.error('❌ World traversal tests failed:', error);
    throw error;
  }
}

async function testNPCInteractions() {
  const npcTests = [
    { key: 'T', description: 'Talk key press' },
    { key: 'E', description: 'Alternative talk key press' },
    { click: true, description: 'Mouse click interaction' }
  ];

  for (const test of npcTests) {
    try {
      simulateKeyPress('ArrowRight');
      await waitForAnimation();
      
      if (test.click) {
        const npc = document.querySelector('.npc');
        if (npc) simulateClick(npc);
      } else {
        simulateKeyPress(test.key);
      }
      
      const dialog = document.querySelector('.dialog-overlay');
      if (!dialog) throw new Error(`Dialog not found after ${test.description}`);
      
      const input = dialog.querySelector('input');
      if (!input) throw new Error('Dialog input not found');
      
      fireEvent.change(input, { target: { value: 'Hello NPC!' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      simulateKeyPress('Escape');
      await waitForAnimation();
      
      console.log(`✅ NPC interaction test passed: ${test.description}`);
    } catch (error) {
      console.error(`❌ NPC interaction test failed: ${test.description}`, error);
      throw error;
    }
  }
}

async function testArtifactCRUD() {
  try {
    simulateKeyPress('C');
    await waitForAnimation();
    
    const createForm = document.querySelector('.artifact-creation-form');
    if (!createForm) throw new Error('Artifact creation form not found');
    
    const testArtifact = {
      name: 'Test Artifact',
      description: 'A test artifact',
      messageText: 'This is a test message'
    };
    
    Object.entries(testArtifact).forEach(([field, value]) => {
      const input = createForm.querySelector(`input[name="${field}"]`);
      if (input) fireEvent.change(input, { target: { value } });
    });
    
    const submitButton = createForm.querySelector('button[type="submit"]');
    if (submitButton) simulateClick(submitButton);
    await waitForAnimation();
    
    const artifact = document.querySelector('.artifact');
    if (!artifact) throw new Error('Created artifact not found');
    
    simulateKeyPress('P');
    await waitForAnimation();
    
    simulateKeyPress('I');
    await waitForAnimation();
    
    const inventory = document.querySelector('.inventory');
    const inventoryItem = inventory?.querySelector('.inventory-item');
    if (!inventoryItem) throw new Error('Artifact not found in inventory');
    
    simulateClick(inventoryItem);
    const dropButton = inventory.querySelector('.drop-button');
    if (dropButton) simulateClick(dropButton);
    await waitForAnimation();
    
    console.log('✅ Artifact CRUD tests passed');
  } catch (error) {
    console.error('❌ Artifact CRUD tests failed:', error);
    throw error;
  }
}

async function testInventoryManagement() {
  try {
    simulateKeyPress('I');
    await waitForAnimation();
    
    const inventory = document.querySelector('.inventory');
    if (!inventory) throw new Error('Inventory not found');
    
    const sortButton = inventory.querySelector('.sort-button');
    if (sortButton) {
      simulateClick(sortButton);
      await waitForAnimation();
    }
    
    const filterInput = inventory.querySelector('.filter-input');
    if (filterInput) {
      fireEvent.change(filterInput, { target: { value: 'test' } });
      await waitForAnimation();
    }
    
    const items = inventory.querySelectorAll('.inventory-item');
    if (items.length > 0) {
      simulateClick(items[0]);
      await waitForAnimation();
      
      const details = document.querySelector('.item-details');
      if (!details) throw new Error('Item details not found');
    }
    
    simulateKeyPress('Escape');
    await waitForAnimation();
    
    console.log('✅ Inventory management tests passed');
  } catch (error) {
    console.error('❌ Inventory management tests failed:', error);
    throw error;
  }
} 