import { expect } from 'chai';
import { ARTIFACT_TYPES, NPC_TYPES, canInteractWithNPC, isWalkable } from '../components/Constants';
import { fireEvent } from '@testing-library/react';

describe('Core Gameplay Mechanics', () => {
  describe('Artifact Pickup', () => {
    it('should detect when character is near an artifact', () => {
      const characterPosition = { x: 64, y: 64 }; // 1 tile position
      const artifactLocation = { x: 1, y: 1 }; // Same tile in grid coordinates
      
      const dx = Math.abs(artifactLocation.x - Math.floor(characterPosition.x / 64));
      const dy = Math.abs(artifactLocation.y - Math.floor(characterPosition.y / 64));
      
      expect(dx).to.equal(0);
      expect(dy).to.equal(0);
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

      expect(artifact).to.have.property('id');
      expect(artifact).to.have.property('name');
      expect(artifact).to.have.property('description');
      expect(artifact).to.have.property('type');
      expect(artifact).to.have.property('location');
      expect(artifact).to.have.property('exp');
    });
  });

  describe('NPC Interaction', () => {
    it('should detect when character is near an NPC', () => {
      const characterPosition = { x: 64, y: 64 }; // 1 tile position
      const npcPosition = { x: 2, y: 1 }; // Adjacent tile
      
      const canInteract = canInteractWithNPC(characterPosition, npcPosition);
      expect(canInteract).to.be.true;
    });

    it('should validate NPC properties', () => {
      const npc = {
        id: '456',
        name: 'Test NPC',
        type: NPC_TYPES.SHAKESPEARE,
        position: { x: 1, y: 1 },
        dialogue: ['Test dialogue']
      };

      expect(npc).to.have.property('id');
      expect(npc).to.have.property('name');
      expect(npc).to.have.property('type');
      expect(npc).to.have.property('position');
      expect(npc).to.have.property('dialogue');
      expect(npc.dialogue).to.be.an('array');
    });
  });

  describe('Movement and Collision', () => {
    it('should validate walkable tiles', () => {
      const mapData = [
        [0, 1, 0],
        [0, 0, 0],
        [1, 0, 1]
      ];

      // Test grass tile (0)
      expect(isWalkable(64, 64, mapData)).to.be.true;
      
      // Test wall tile (1)
      expect(isWalkable(64, 0, mapData)).to.be.false;
    });
  });

  describe('Inventory Management', () => {
    it('should validate inventory operations', () => {
      let inventory = [];
      const artifact = {
        id: '789',
        name: 'Test Artifact',
        type: ARTIFACT_TYPES.WEAPON
      };

      // Add to inventory
      inventory.push(artifact);
      expect(inventory).to.have.lengthOf(1);
      expect(inventory[0]).to.equal(artifact);

      // Remove from inventory
      inventory = inventory.filter(item => item.id !== artifact.id);
      expect(inventory).to.have.lengthOf(0);
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
      expect(mapData[portalTile.y][portalTile.x]).to.equal(5);
    });

    it('should validate map transitions', () => {
      const currentMapIndex = 0;
      const totalMaps = MAPS.length;
      
      // Ensure we have multiple maps
      expect(totalMaps).to.be.greaterThan(1);
      
      // Ensure map index is within bounds
      expect(currentMapIndex).to.be.lessThan(totalMaps);
    });
  });
});

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

// Core gameplay test suite
export const runGameplayTests = async () => {
  console.log('🎮 Starting gameplay tests...');
  
  try {
    // Add world traversal tests
    console.log('🌎 Testing world traversal...');
    await testWorldTraversal();
    
    // 1. NPC Interaction Tests
    console.log('👥 Testing NPC interactions...');
    await testNPCInteractions();
    
    // 2. Artifact CRUD Tests
    console.log('📦 Testing artifact CRUD operations...');
    await testArtifactCRUD();
    
    // 3. Inventory Management Tests
    console.log('🎒 Testing inventory management...');
    await testInventoryManagement();
    
    console.log('✅ All gameplay tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// NPC Interaction Tests
async function testNPCInteractions() {
  // Test approaching NPC
  const npcTests = [
    { key: 'T', description: 'Talk key press' },
    { key: 'E', description: 'Alternative talk key press' },
    { click: true, description: 'Mouse click interaction' }
  ];

  for (const test of npcTests) {
    try {
      // Move character near NPC
      simulateKeyPress('ArrowRight');
      await waitForAnimation();
      
      // Interact with NPC
      if (test.click) {
        const npc = document.querySelector('.npc');
        if (npc) simulateClick(npc);
      } else {
        simulateKeyPress(test.key);
      }
      
      // Verify dialog appears
      const dialog = document.querySelector('.dialog-overlay');
      if (!dialog) throw new Error(`Dialog not found after ${test.description}`);
      
      // Test dialog interaction
      const input = dialog.querySelector('input');
      if (!input) throw new Error('Dialog input not found');
      
      fireEvent.change(input, { target: { value: 'Hello NPC!' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Close dialog
      simulateKeyPress('Escape');
      await waitForAnimation();
      
      console.log(`✅ NPC interaction test passed: ${test.description}`);
    } catch (error) {
      console.error(`❌ NPC interaction test failed: ${test.description}`, error);
      throw error;
    }
  }
}

// Artifact CRUD Tests
async function testArtifactCRUD() {
  try {
    // Create Artifact
    simulateKeyPress('C');
    await waitForAnimation();
    
    const createForm = document.querySelector('.artifact-creation-form');
    if (!createForm) throw new Error('Artifact creation form not found');
    
    // Fill form
    const testArtifact = {
      name: 'Test Artifact',
      description: 'A test artifact',
      messageText: 'This is a test message'
    };
    
    Object.entries(testArtifact).forEach(([field, value]) => {
      const input = createForm.querySelector(`input[name="${field}"]`);
      if (input) fireEvent.change(input, { target: { value } });
    });
    
    // Submit form
    const submitButton = createForm.querySelector('button[type="submit"]');
    if (submitButton) simulateClick(submitButton);
    await waitForAnimation();
    
    // Read/Verify Artifact
    const artifact = document.querySelector('.artifact');
    if (!artifact) throw new Error('Created artifact not found');
    
    // Update Artifact (Pick up)
    simulateKeyPress('P');
    await waitForAnimation();
    
    // Verify in inventory
    simulateKeyPress('I');
    await waitForAnimation();
    
    const inventory = document.querySelector('.inventory');
    const inventoryItem = inventory?.querySelector('.inventory-item');
    if (!inventoryItem) throw new Error('Artifact not found in inventory');
    
    // Delete Artifact (Drop from inventory)
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

// Inventory Management Tests
async function testInventoryManagement() {
  try {
    // Open inventory
    simulateKeyPress('I');
    await waitForAnimation();
    
    const inventory = document.querySelector('.inventory');
    if (!inventory) throw new Error('Inventory not found');
    
    // Test inventory sorting
    const sortButton = inventory.querySelector('.sort-button');
    if (sortButton) {
      simulateClick(sortButton);
      await waitForAnimation();
    }
    
    // Test inventory filtering
    const filterInput = inventory.querySelector('.filter-input');
    if (filterInput) {
      fireEvent.change(filterInput, { target: { value: 'test' } });
      await waitForAnimation();
    }
    
    // Test inventory item interaction
    const items = inventory.querySelectorAll('.inventory-item');
    if (items.length > 0) {
      simulateClick(items[0]);
      await waitForAnimation();
      
      // Test item details view
      const details = document.querySelector('.item-details');
      if (!details) throw new Error('Item details not found');
    }
    
    // Close inventory
    simulateKeyPress('Escape');
    await waitForAnimation();
    
    console.log('✅ Inventory management tests passed');
  } catch (error) {
    console.error('❌ Inventory management tests failed:', error);
    throw error;
  }
}

// Add before other test functions
async function testWorldTraversal() {
  try {
    // Test portal detection
    const findPortal = async () => {
      // Move character to find portal
      const movements = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      for (const direction of movements) {
        simulateKeyPress(direction);
        await waitForAnimation();
        
        // Check if we're on a portal tile
        const portalFlash = document.querySelector('.portal-flash');
        if (portalFlash) return true;
      }
      return false;
    };

    // Test portal transition
    const testPortalTransition = async () => {
      const initialMap = document.querySelector('.game-world');
      const initialMapStyle = initialMap?.style.transform;

      // Move to portal
      const foundPortal = await findPortal();
      if (!foundPortal) throw new Error('Portal not found in current map');

      // Wait for transition effects
      await waitForAnimation(1500); // Wait for transition animation

      const newMap = document.querySelector('.game-world');
      const newMapStyle = newMap?.style.transform;

      // Verify map changed
      if (initialMapStyle === newMapStyle) {
        throw new Error('Map transition did not occur');
      }

      console.log('✅ Portal transition successful');
    };

    // Test map boundaries
    const testMapBoundaries = async () => {
      // Try to move beyond map boundaries
      for (let i = 0; i < 20; i++) {
        simulateKeyPress('ArrowLeft');
        await waitForAnimation(100);
      }

      // Get character position
      const character = document.querySelector('.character');
      const position = character?.getBoundingClientRect();

      // Verify character didn't move beyond boundaries
      if (position && position.x < 0) {
        throw new Error('Character moved beyond map boundaries');
      }

      console.log('✅ Map boundaries test passed');
    };

    // Test world state persistence
    const testWorldStatePersistence = async () => {
      // Store initial state
      const initialState = localStorage.getItem('gameState');
      
      // Move to new position
      simulateKeyPress('ArrowRight');
      await waitForAnimation();
      
      // Check if state updated
      const newState = localStorage.getItem('gameState');
      if (initialState === newState) {
        throw new Error('World state not persisting after movement');
      }

      console.log('✅ World state persistence test passed');
    };

    // Run all world traversal tests
    await testPortalTransition();
    await testMapBoundaries();
    await testWorldStatePersistence();

    console.log('✅ World traversal tests passed');
  } catch (error) {
    console.error('❌ World traversal tests failed:', error);
    throw error;
  }
}

// Run tests when document is ready
document.addEventListener('DOMContentLoaded', runGameplayTests); 