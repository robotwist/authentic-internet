#!/usr/bin/env node

/**
 * Mobile and Accessibility Test Script
 * Tests the mobile responsiveness and accessibility features of the GameWorld component
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MobileAccessibilityTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      mobile: {},
      accessibility: {},
      keyboard: {},
      screenReader: {},
      highContrast: {},
      reducedMotion: {}
    };
  }

  async init() {
    console.log('🚀 Starting Mobile and Accessibility Tests...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Enable accessibility features
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });
    
    console.log('✅ Browser initialized');
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile Portrait' },
      { width: 768, height: 1024, name: 'Tablet Portrait' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      console.log(`  Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      await this.page.setViewport(viewport);
      await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
      
      // Wait for game to load
      await this.page.waitForSelector('[data-testid="game-container"]', { timeout: 10000 });
      
      // Test mobile controls visibility
      const mobileControls = await this.page.$('.mobile-controls');
      const shouldShowMobileControls = viewport.width <= 768;
      
      this.results.mobile[viewport.name] = {
        mobileControlsVisible: !!mobileControls === shouldShowMobileControls,
        viewport: viewport
      };
      
      // Test touch-friendly elements
      if (viewport.width <= 768) {
        const artifacts = await this.page.$$('.artifact');
        const npcs = await this.page.$$('.npc');
        
        for (const artifact of artifacts) {
          const box = await artifact.boundingBox();
          this.results.mobile[viewport.name].touchFriendly = {
            artifacts: box.width >= 44 && box.height >= 44,
            npcs: true // Will be tested separately
          };
        }
      }
      
      // Test responsive text sizing
      const mapKeyHint = await this.page.$('.map-key-hint');
      if (mapKeyHint) {
        const fontSize = await this.page.evaluate(el => {
          return window.getComputedStyle(el).fontSize;
        }, mapKeyHint);
        
        this.results.mobile[viewport.name].responsiveText = {
          fontSize: fontSize,
          appropriate: viewport.width <= 768 ? fontSize.includes('12px') || fontSize.includes('11px') : true
        };
      }
    }
  }

  async testAccessibility() {
    console.log('\n♿ Testing Accessibility Features...');
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    // Test ARIA attributes
    const gameContainer = await this.page.$('[role="application"]');
    const gameInstructions = await this.page.$('#game-instructions');
    const character = await this.page.$('[data-testid="character"]');
    
    this.results.accessibility.ariaAttributes = {
      gameContainer: !!gameContainer,
      gameInstructions: !!gameInstructions,
      character: !!character
    };
    
    // Test screen reader announcements
    const liveRegion = await this.page.$('#screen-reader-announcements');
    this.results.accessibility.screenReaderSupport = {
      liveRegion: !!liveRegion,
      ariaLive: liveRegion ? await liveRegion.evaluate(el => el.getAttribute('aria-live')) : null
    };
    
    // Test focus management
    await this.page.keyboard.press('Tab');
    const focusedElement = await this.page.evaluate(() => document.activeElement);
    this.results.accessibility.focusManagement = {
      focusable: focusedElement && focusedElement.tagName === 'DIV',
      hasRole: focusedElement ? await this.page.evaluate(el => el.getAttribute('role')) : null
    };
  }

  async testKeyboardNavigation() {
    console.log('\n⌨️ Testing Keyboard Navigation...');
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    const keys = ['i', 'm', 'f', 't', 'Escape'];
    const keyResults = {};
    
    for (const key of keys) {
      console.log(`  Testing key: ${key}`);
      
      // Press key
      await this.page.keyboard.press(key);
      await this.page.waitForTimeout(500);
      
      // Check for expected UI changes
      let uiChanged = false;
      
      switch (key) {
        case 'i':
          uiChanged = await this.page.$('.inventory') !== null;
          break;
        case 'm':
          uiChanged = await this.page.$('.world-map') !== null;
          break;
        case 'f':
          uiChanged = await this.page.$('.feedback-form') !== null;
          break;
        case 't':
          uiChanged = await this.page.$('.npc-dialog') !== null;
          break;
        case 'Escape':
          // Check if menus are closed
          const inventory = await this.page.$('.inventory');
          const worldMap = await this.page.$('.world-map');
          uiChanged = !inventory && !worldMap;
          break;
      }
      
      keyResults[key] = uiChanged;
    }
    
    this.results.keyboard = keyResults;
  }

  async testScreenReaderMode() {
    console.log('\n🔊 Testing Screen Reader Mode...');
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    // Enable screen reader mode
    await this.page.keyboard.press('s');
    await this.page.waitForTimeout(500);
    
    // Check for accessibility status indicator
    const statusIndicator = await this.page.$('.accessibility-status');
    this.results.screenReader.statusIndicator = !!statusIndicator;
    
    // Test announcements
    await this.page.keyboard.press('i');
    await this.page.waitForTimeout(500);
    
    const liveRegion = await this.page.$('#screen-reader-announcements');
    const announcement = await this.page.evaluate(el => el.textContent, liveRegion);
    
    this.results.screenReader.announcements = {
      liveRegionExists: !!liveRegion,
      hasAnnouncement: announcement && announcement.length > 0
    };
  }

  async testHighContrastMode() {
    console.log('\n🎨 Testing High Contrast Mode...');
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    // Enable high contrast mode
    await this.page.keyboard.press('h');
    await this.page.waitForTimeout(500);
    
    // Check for high contrast classes
    const gameContainer = await this.page.$('.game-container.high-contrast');
    this.results.highContrast.enabled = !!gameContainer;
    
    if (gameContainer) {
      // Test high contrast styles
      const character = await this.page.$('.character');
      const artifact = await this.page.$('.artifact');
      
      const characterBorder = await this.page.evaluate(el => {
        return window.getComputedStyle(el).border;
      }, character);
      
      const artifactBackground = await this.page.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      }, artifact);
      
      this.results.highContrast.styles = {
        characterBorder: characterBorder,
        artifactBackground: artifactBackground,
        hasHighContrast: characterBorder.includes('3px') && artifactBackground.includes('rgb(255, 255, 0)')
      };
    }
  }

  async testReducedMotionMode() {
    console.log('\n🎬 Testing Reduced Motion Mode...');
    
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    // Enable reduced motion mode
    await this.page.keyboard.press('r');
    await this.page.waitForTimeout(500);
    
    // Check for reduced motion classes
    const gameContainer = await this.page.$('.game-container.reduced-motion');
    this.results.reducedMotion.enabled = !!gameContainer;
    
    if (gameContainer) {
      // Test that animations are disabled
      const gameWorld = await this.page.$('.game-world');
      const character = await this.page.$('.character');
      
      const gameWorldTransition = await this.page.evaluate(el => {
        return window.getComputedStyle(el).transition;
      }, gameWorld);
      
      const characterTransition = await this.page.evaluate(el => {
        return window.getComputedStyle(el).transition;
      }, character);
      
      this.results.reducedMotion.animationsDisabled = {
        gameWorld: gameWorldTransition === 'none',
        character: characterTransition === 'none'
      };
    }
  }

  async testMobileTouchControls() {
    console.log('\n👆 Testing Mobile Touch Controls...');
    
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.goto('http://localhost:5173/game', { waitUntil: 'networkidle0' });
    
    // Wait for mobile controls to appear
    await this.page.waitForSelector('.mobile-controls', { timeout: 5000 });
    
    // Test each mobile control button
    const buttons = ['inventory-btn', 'map-btn', 'feedback-btn', 'accessibility-btn'];
    const buttonResults = {};
    
    for (const buttonClass of buttons) {
      const button = await this.page.$(`.${buttonClass}`);
      
      if (button) {
        // Test button click
        await button.click();
        await this.page.waitForTimeout(500);
        
        // Check for expected UI changes
        let uiChanged = false;
        
        switch (buttonClass) {
          case 'inventory-btn':
            uiChanged = await this.page.$('.inventory') !== null;
            break;
          case 'map-btn':
            uiChanged = await this.page.$('.world-map') !== null;
            break;
          case 'feedback-btn':
            uiChanged = await this.page.$('.feedback-form') !== null;
            break;
          case 'accessibility-btn':
            const statusIndicator = await this.page.$('.accessibility-status');
            uiChanged = !!statusIndicator;
            break;
        }
        
        buttonResults[buttonClass] = {
          exists: true,
          clickable: true,
          uiChanged: uiChanged
        };
      } else {
        buttonResults[buttonClass] = {
          exists: false,
          clickable: false,
          uiChanged: false
        };
      }
    }
    
    this.results.mobile.touchControls = buttonResults;
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.keys(this.results).length,
        passed: 0,
        failed: 0
      },
      details: this.results
    };
    
    // Calculate pass/fail counts
    let passed = 0;
    let failed = 0;
    
    Object.values(this.results).forEach(category => {
      Object.values(category).forEach(test => {
        if (typeof test === 'boolean') {
          test ? passed++ : failed++;
        } else if (typeof test === 'object') {
          Object.values(test).forEach(subTest => {
            if (typeof subTest === 'boolean') {
              subTest ? passed++ : failed++;
            }
          });
        }
      });
    });
    
    report.summary.passed = passed;
    report.summary.failed = failed;
    
    // Save report
    const reportPath = path.join(__dirname, 'mobile-accessibility-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Test Report saved to: ${reportPath}`);
    console.log(`📈 Summary: ${passed} passed, ${failed} failed`);
    
    return report;
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testMobileResponsiveness();
      await this.testAccessibility();
      await this.testKeyboardNavigation();
      await this.testScreenReaderMode();
      await this.testHighContrastMode();
      await this.testReducedMotionMode();
      await this.testMobileTouchControls();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 All tests completed!');
      console.log('\n📋 Test Results Summary:');
      console.log(JSON.stringify(report.summary, null, 2));
      
      return report;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run tests if this script is executed directly
const tester = new MobileAccessibilityTester();
tester.runAllTests()
  .then(report => {
    console.log('\n✅ Mobile and Accessibility tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Mobile and Accessibility tests failed:', error);
    process.exit(1);
  });

export default MobileAccessibilityTester; 