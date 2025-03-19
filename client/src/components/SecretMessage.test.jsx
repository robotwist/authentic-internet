import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SecretMessage from './SecretMessage';

// Mock the MagicalButton component
jest.mock('./MagicalButton', () => {
  return function MockMagicalButton() {
    return <div data-testid="magical-button">Mocked Magical Button</div>;
  };
});

describe('SecretMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the secret message', () => {
    render(<SecretMessage />);
    
    const messageElement = screen.getByText(/Be patient very wise one/i);
    expect(messageElement).toBeInTheDocument();
  });

  it('does not show the magical button initially', () => {
    render(<SecretMessage />);
    
    const buttonElement = screen.queryByTestId('magical-button');
    expect(buttonElement).not.toBeInTheDocument();
  });

  it('shows the magical button after delay', async () => {
    render(<SecretMessage />);
    
    // Button should not exist initially
    expect(screen.queryByTestId('magical-button')).not.toBeInTheDocument();
    
    // Advance timers by 2 seconds (the delay time)
    jest.advanceTimersByTime(2000);
    
    // Now the button should be visible
    await waitFor(() => {
      expect(screen.getByTestId('magical-button')).toBeInTheDocument();
    });
  });
}); 