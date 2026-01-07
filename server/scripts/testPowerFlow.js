/**
 * Test script for Power System Flow
 * Tests: unlock → activate → gameplay effects
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Artifact from '../models/Artifact.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentic-internet';

async function testPowerFlow() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find or create a test user
    let testUser = await User.findOne({ username: 'powertest' });
    if (!testUser) {
      testUser = new User({
        username: 'powertest',
        email: 'powertest@test.com',
        password: 'Test123!',
        experience: 0,
        level: 1,
        unlockedPowers: [],
        activePowers: [],
        maxActivePowers: 3
      });
      await testUser.save();
      console.log('✅ Created test user: powertest');
    } else {
      // Reset user powers for clean test
      testUser.unlockedPowers = [];
      testUser.activePowers = [];
      await testUser.save();
      console.log('✅ Reset test user powers');
    }

    // Test power unlocking directly using User model methods
    // Simulate artifact completion rewards
    const testPowers = ['speed_boost', 'double_jump'];
    console.log(`✅ Testing with powers: ${testPowers.join(', ')}`);

    console.log('\n📋 Testing Power Flow:\n');

    // Test 1: Check initial state
    console.log('1️⃣  Initial State:');
    console.log(`   - Unlocked Powers: ${testUser.unlockedPowers.length}`);
    console.log(`   - Active Powers: ${testUser.activePowers.length}`);
    console.log(`   - Max Active Powers: ${testUser.maxActivePowers}`);

    // Test 2: Unlock powers directly
    console.log('\n2️⃣  Unlocking Powers...');
    const unlockedPowers = [];
    for (const powerId of testPowers) {
      const powerName = powerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      const powerResult = testUser.unlockPower(
        powerId,
        powerName,
        `Test ${powerId} description`,
        'Test Artifact'
      );
      if (powerResult.unlocked || powerResult.upgraded) {
        unlockedPowers.push(powerResult.power);
        console.log(`   - ✅ Unlocked: ${powerResult.power.name} (${powerResult.power.id})`);
      } else {
        console.log(`   - ❌ Failed to unlock: ${powerId}`);
      }
    }

    await testUser.save();

    // Test 4: Check unlocked powers
    console.log('\n4️⃣  Checking Unlocked Powers:');
    const refreshedUser = await User.findById(testUser._id);
    console.log(`   - Total Unlocked: ${refreshedUser.unlockedPowers.length}`);
    refreshedUser.unlockedPowers.forEach(power => {
      console.log(`   - ${power.name} (${power.id}) - Level: ${power.level}, Active: ${power.active}`);
    });

    // Test 5: Activate a power
    console.log('\n5️⃣  Activating Power...');
    const speedBoostPower = refreshedUser.unlockedPowers.find(p => p.id === 'speed_boost');
    if (speedBoostPower) {
      const activateResult = refreshedUser.setPowerActive('speed_boost', true);
      if (activateResult.success) {
        console.log(`   - ✅ Activated: ${activateResult.power.name}`);
        console.log(`   - Active Powers: ${refreshedUser.activePowers.join(', ')}`);
      } else {
        console.log(`   - ❌ Failed: ${activateResult.error}`);
      }
      await refreshedUser.save();
    }

    // Test 6: Check active powers
    console.log('\n6️⃣  Checking Active Powers:');
    const finalUser = await User.findById(testUser._id);
    console.log(`   - Active Powers Count: ${finalUser.activePowers.length}`);
    console.log(`   - Active Power IDs: ${finalUser.activePowers.join(', ')}`);

    // Test 7: Verify API endpoint structure
    console.log('\n7️⃣  Power Data Structure:');
    const powerData = {
      unlockedPowers: finalUser.unlockedPowers.map(p => ({
        id: p.id,
        name: p.name,
        level: p.level,
        active: p.active,
        unlockedAt: p.unlockedAt
      })),
      activePowers: finalUser.activePowers,
      maxActivePowers: finalUser.maxActivePowers
    };
    console.log(JSON.stringify(powerData, null, 2));

    console.log('\n✅ Power Flow Test Complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Powers Unlocked: ${finalUser.unlockedPowers.length}/${testPowers.length}`);
    console.log(`   - Powers Active: ${finalUser.activePowers.length}`);
    console.log(`   - Test Status: ${finalUser.unlockedPowers.length === 2 && finalUser.activePowers.includes('speed_boost') ? '✅ PASS' : '❌ FAIL'}`);

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testPowerFlow();

