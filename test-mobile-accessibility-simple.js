#!/usr/bin/env node

/**
 * Simple Mobile and Accessibility Test Script
 * Tests the mobile responsiveness and accessibility features by analyzing code structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleMobileAccessibilityTester {
  constructor() {
    this.results = {
      mobile: {},
      accessibility: {},
      css: {},
      components: {}
    };
  }

  async testGameWorldComponent() {
    console.log('🔍 Testing GameWorld Component...');
    
    const gameWorldPath = path.join(__dirname, 'client/src/components/GameWorld.jsx');
    const gameWorldContent = fs.readFileSync(gameWorldPath, 'utf8');
    
    // Test mobile state management
    const hasMobileState = gameWorldContent.includes('mobileState');
    const hasAccessibilityState = gameWorldContent.includes('screenReaderMode') && 
                                 gameWorldContent.includes('highContrastMode') && 
                                 gameWorldContent.includes('reducedMotionMode');
    
    // Test accessibility attributes
    const hasAriaLabels = gameWorldContent.includes('aria-label') && 
                         gameWorldContent.includes('aria-describedby') &&
                         gameWorldContent.includes('role="application"');
    
    // Test screen reader support
    const hasScreenReaderAnnouncements = gameWorldContent.includes('announceToScreenReader') &&
                                        gameWorldContent.includes('aria-live="polite"');
    
    // Test mobile controls
    const hasMobileControls = gameWorldContent.includes('mobile-controls') &&
                             gameWorldContent.includes('mobile-control-btn');
    
    // Test keyboard navigation
    const hasKeyboardNavigation = gameWorldContent.includes('handleKeyDown') &&
                                 gameWorldContent.includes('onKeyDown');
    
    this.results.components.gameWorld = {
      mobileState: hasMobileState,
      accessibilityState: hasAccessibilityState,
      ariaLabels: hasAriaLabels,
      screenReaderSupport: hasScreenReaderAnnouncements,
      mobileControls: hasMobileControls,
      keyboardNavigation: hasKeyboardNavigation
    };
    
    console.log('✅ GameWorld component tests completed');
  }

  async testGameWorldCSS() {
    console.log('🎨 Testing GameWorld CSS...');
    
    const cssPath = path.join(__dirname, 'client/src/components/GameWorld.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test mobile responsive styles
    const hasMobileMediaQueries = cssContent.includes('@media (max-width: 768px)') &&
                                 cssContent.includes('@media (max-width: 480px)');
    
    // Test accessibility styles
    const hasHighContrastMode = cssContent.includes('.high-contrast') &&
                               cssContent.includes('--primary-color: #000000');
    
    const hasReducedMotionMode = cssContent.includes('.reduced-motion') &&
                                cssContent.includes('transition: none !important');
    
    // Test mobile controls styles
    const hasMobileControlsCSS = cssContent.includes('.mobile-controls') &&
                                cssContent.includes('.mobile-control-btn');
    
    // Test focus indicators
    const hasFocusIndicators = cssContent.includes(':focus-visible') &&
                              cssContent.includes('outline: 3px solid');
    
    // Test screen reader styles
    const hasScreenReaderStyles = cssContent.includes('.sr-only') &&
                                 cssContent.includes('position: absolute');
    
    this.results.css.gameWorld = {
      mobileMediaQueries: hasMobileMediaQueries,
      highContrastMode: hasHighContrastMode,
      reducedMotionMode: hasReducedMotionMode,
      mobileControlsCSS: hasMobileControlsCSS,
      focusIndicators: hasFocusIndicators,
      screenReaderStyles: hasScreenReaderStyles
    };
    
    console.log('✅ GameWorld CSS tests completed');
  }

  async testIndexCSS() {
    console.log('🎨 Testing Index CSS...');
    
    const cssPath = path.join(__dirname, 'client/src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test mobile responsive styles
    const hasMobileResponsiveness = cssContent.includes('@media (max-width: 768px)');
    
    // Test touch optimizations
    const hasTouchOptimizations = cssContent.includes('touch-action: manipulation') &&
                                 cssContent.includes('-webkit-tap-highlight-color: transparent');
    
    // Test iOS specific styles
    const hasIOSStyles = cssContent.includes('-webkit-touch-callout: none') &&
                        cssContent.includes('-webkit-fill-available');
    
    this.results.css.index = {
      mobileResponsiveness: hasMobileResponsiveness,
      touchOptimizations: hasTouchOptimizations,
      iosStyles: hasIOSStyles
    };
    
    console.log('✅ Index CSS tests completed');
  }

  async testNPCCSS() {
    console.log('🎨 Testing NPC CSS...');
    
    const cssPath = path.join(__dirname, 'client/src/components/NPC.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Test mobile responsive styles
    const hasMobileResponsiveness = cssContent.includes('@media (max-width: 768px)');
    
    // Test keyboard handling
    const hasKeyboardHandling = cssContent.includes('keyboard-open') &&
                               cssContent.includes('keyboard-open .dialog-box');
    
    // Test touch-friendly improvements
    const hasTouchFriendly = cssContent.includes('min-height: 44px') &&
                            cssContent.includes('touch-action: manipulation');
    
    this.results.css.npc = {
      mobileResponsiveness: hasMobileResponsiveness,
      keyboardHandling: hasKeyboardHandling,
      touchFriendly: hasTouchFriendly
    };
    
    console.log('✅ NPC CSS tests completed');
  }

  async testTouchControls() {
    console.log('👆 Testing Touch Controls...');
    
    const touchControlsPath = path.join(__dirname, 'client/src/components/TouchControls.jsx');
    const touchControlsCSSPath = path.join(__dirname, 'client/src/components/TouchControls.css');
    
    if (fs.existsSync(touchControlsPath)) {
      const touchControlsContent = fs.readFileSync(touchControlsPath, 'utf8');
      
      const hasTouchControls = touchControlsContent.includes('TouchControls') &&
                              touchControlsContent.includes('onTouchStart') &&
                              touchControlsContent.includes('onTouchEnd');
      
      this.results.mobile.touchControls = {
        componentExists: true,
        hasTouchHandlers: hasTouchControls
      };
    } else {
      this.results.mobile.touchControls = {
        componentExists: false,
        hasTouchHandlers: false
      };
    }
    
    if (fs.existsSync(touchControlsCSSPath)) {
      const touchControlsCSSContent = fs.readFileSync(touchControlsCSSPath, 'utf8');
      
      const hasMobileStyles = touchControlsCSSContent.includes('@media (max-width: 768px)') ||
                             touchControlsCSSContent.includes('(pointer: coarse)');
      
      this.results.mobile.touchControlsCSS = {
        exists: true,
        hasMobileStyles: hasMobileStyles
      };
    } else {
      this.results.mobile.touchControlsCSS = {
        exists: false,
        hasMobileStyles: false
      };
    }
    
    console.log('✅ Touch Controls tests completed');
  }

  async testAccessibilityFeatures() {
    console.log('♿ Testing Accessibility Features...');
    
    // Test for accessibility utilities
    const errorTrackerPath = path.join(__dirname, 'client/src/utils/errorTracker.js');
    const debugToolsPath = path.join(__dirname, 'client/src/utils/debugTools.js');
    
    let hasErrorTracking = false;
    let hasDebugTools = false;
    
    if (fs.existsSync(errorTrackerPath)) {
      const errorTrackerContent = fs.readFileSync(errorTrackerPath, 'utf8');
      hasErrorTracking = errorTrackerContent.includes('trackError') &&
                        errorTrackerContent.includes('ERROR_LEVELS');
    }
    
    if (fs.existsSync(debugToolsPath)) {
      const debugToolsContent = fs.readFileSync(debugToolsPath, 'utf8');
      hasDebugTools = debugToolsContent.includes('debugNPCSprites') &&
                     debugToolsContent.includes('fixNPCRendering');
    }
    
    this.results.accessibility.utilities = {
      errorTracking: hasErrorTracking,
      debugTools: hasDebugTools
    };
    
    // Test for accessibility in other components
    const componentsDir = path.join(__dirname, 'client/src/components');
    const componentFiles = fs.readdirSync(componentsDir).filter(file => file.endsWith('.jsx'));
    
    let componentsWithAccessibility = 0;
    let totalComponents = componentFiles.length;
    
    for (const file of componentFiles) {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes('aria-label') || content.includes('role=') || content.includes('tabIndex')) {
        componentsWithAccessibility++;
      }
    }
    
    this.results.accessibility.components = {
      totalComponents,
      componentsWithAccessibility,
      accessibilityCoverage: (componentsWithAccessibility / totalComponents * 100).toFixed(1) + '%'
    };
    
    console.log('✅ Accessibility Features tests completed');
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0
      },
      details: this.results
    };
    
    // Calculate pass/fail counts
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    Object.values(this.results).forEach(category => {
      Object.values(category).forEach(test => {
        if (typeof test === 'boolean') {
          total++;
          test ? passed++ : failed++;
        } else if (typeof test === 'object') {
          Object.values(test).forEach(subTest => {
            if (typeof subTest === 'boolean') {
              total++;
              subTest ? passed++ : failed++;
            }
          });
        }
      });
    });
    
    report.summary.totalTests = total;
    report.summary.passed = passed;
    report.summary.failed = failed;
    report.summary.successRate = ((passed / total) * 100).toFixed(1) + '%';
    
    // Save report
    const reportPath = path.join(__dirname, 'mobile-accessibility-simple-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Test Report saved to: ${reportPath}`);
    console.log(`📈 Summary: ${passed} passed, ${failed} failed (${report.summary.successRate} success rate)`);
    
    return report;
  }

  async runAllTests() {
    try {
      console.log('🚀 Starting Simple Mobile and Accessibility Tests...\n');
      
      await this.testGameWorldComponent();
      await this.testGameWorldCSS();
      await this.testIndexCSS();
      await this.testNPCCSS();
      await this.testTouchControls();
      await this.testAccessibilityFeatures();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 All tests completed!');
      console.log('\n📋 Test Results Summary:');
      console.log(JSON.stringify(report.summary, null, 2));
      
      // Print detailed results
      console.log('\n📋 Detailed Results:');
      console.log('GameWorld Component:', this.results.components.gameWorld);
      console.log('GameWorld CSS:', this.results.css.gameWorld);
      console.log('Index CSS:', this.results.css.index);
      console.log('NPC CSS:', this.results.css.npc);
      console.log('Touch Controls:', this.results.mobile.touchControls);
      console.log('Accessibility Utilities:', this.results.accessibility.utilities);
      console.log('Accessibility Components:', this.results.accessibility.components);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }
}

// Run tests
const tester = new SimpleMobileAccessibilityTester();
tester.runAllTests()
  .then(report => {
    console.log('\n✅ Simple Mobile and Accessibility tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Simple Mobile and Accessibility tests failed:', error);
    process.exit(1);
  });

export default SimpleMobileAccessibilityTester; 