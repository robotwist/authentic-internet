import '@testing-library/jest-dom';
import { expect, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach } from 'vitest';

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock Audio
class AudioMock {
  play() { return Promise.resolve(); }
  pause() {}
}
global.Audio = AudioMock;

// Mock window.showNotification
global.showNotification = vi.fn();

// Setup DOM environment
beforeAll(() => {
  document.body.innerHTML = `
    <div id="root">
      <div class="game-container">
        <div class="game-world"></div>
      </div>
    </div>
  `;
}); 