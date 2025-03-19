import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MagicalButton from './MagicalButton';

// Mock the Audio constructor and its methods
window.HTMLMediaElement.prototype.play = jest.fn();
window.HTMLMediaElement.prototype.pause = jest.fn();

describe('MagicalButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'Audio').mockImplementation(() => {
      return {
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn(),
        volume: 0
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders the button initially', () => {
    render(<MagicalButton />);
    
    const buttonElement = screen.getByText(/Press the Button/i);
    expect(buttonElement).toBeInTheDocument();
  });

  it('hides the button and shows the bird when clicked', async () => {
    // Mock getBoundingClientRect to provide dimensions for bird positioning
    Element.prototype.getBoundingClientRect = jest.fn(() => {
      return {
        width: 100,
        height: 50,
        top: 100,
        left: 100,
        bottom: 150,
        right: 200,
        x: 100,
        y: 100
      };
    });

    render(<MagicalButton />);
    
    // Button should be visible initially
    const buttonElement = screen.getByText(/Press the Button/i);
    expect(buttonElement).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(buttonElement);
    
    // Button should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Press the Button/i)).not.toBeInTheDocument();
    });
    
    // Bird should be visible
    const birdElement = document.querySelector('.magical-bird');
    expect(birdElement).toBeInTheDocument();
    
    // Advance timers to complete bird animation
    jest.advanceTimersByTime(2000);
    
    // Bird should now be hidden
    await waitFor(() => {
      expect(document.querySelector('.magical-bird')).not.toBeInTheDocument();
    });
  });

  it('tries to play a sound when the button is clicked', () => {
    render(<MagicalButton />);
    
    const buttonElement = screen.getByText(/Press the Button/i);
    fireEvent.click(buttonElement);
    
    // Check if Audio constructor was called with the correct path
    expect(window.Audio).toHaveBeenCalledWith('/assets/sounds/poof.mp3');
    
    // Check if play method was called
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });
}); 