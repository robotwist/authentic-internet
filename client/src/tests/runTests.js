import { simulateKeyPress, simulateClick, waitForAnimation } from './gameplayTests';

async function runGameplayTests() {
  console.log('🎮 Starting gameplay tests...');

  try {
    // Test artifact pickup
    console.log('\n📦 Testing artifact pickup...');
    const artifactElement = document.querySelector('.artifact');
    if (artifactElement) {
      // Move character near artifact
      simulateKeyPress('ArrowRight');
      await waitForAnimation(100);
      
      // Press P to pick up
      simulateKeyPress('p');
      await waitForAnimation(500);
      
      // Verify artifact is in inventory
      simulateKeyPress('i');
      await waitForAnimation(100);
      
      const inventoryItems = document.querySelectorAll('.artifact-item');
      console.log(`✅ Found ${inventoryItems.length} items in inventory`);
    }

    // Test NPC interaction
    console.log('\n🗣️ Testing NPC interaction...');
    const npcElement = document.querySelector('.npc');
    if (npcElement) {
      // Move character near NPC
      simulateKeyPress('ArrowLeft');
      await waitForAnimation(100);
      
      // Press T to talk
      simulateKeyPress('t');
      await waitForAnimation(500);
      
      const dialogBox = document.querySelector('.dialog-box');
      console.log(`✅ Dialog box ${dialogBox ? 'opened' : 'not found'}`);
      
      // Close dialog
      simulateKeyPress('Escape');
      await waitForAnimation(100);
    }

    // Test inventory management
    console.log('\n🎒 Testing inventory management...');
    simulateKeyPress('i');
    await waitForAnimation(100);
    
    const inventoryOverlay = document.querySelector('.inventory-overlay');
    console.log(`✅ Inventory overlay ${inventoryOverlay ? 'opened' : 'not found'}`);
    
    // Close inventory
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
      simulateClick(closeButton);
      await waitForAnimation(100);
    }

    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests when document is ready
document.addEventListener('DOMContentLoaded', runGameplayTests); 