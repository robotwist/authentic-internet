/**
 * Onboarding System Tests
 * 
 * This test suite verifies the onboarding flow works correctly
 * and guides new users to create valuable artifacts.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../client/src/context/AuthContext';
import OnboardingFlow from '../client/src/components/OnboardingFlow';
import OnboardingTrigger from '../client/src/components/OnboardingTrigger';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for artifact creation
global.fetch = jest.fn();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Onboarding System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('OnboardingFlow Component', () => {
    const mockOnComplete = jest.fn();
    const mockOnSkip = jest.fn();

    beforeEach(() => {
      mockOnComplete.mockClear();
      mockOnSkip.mockClear();
    });

    test('renders welcome screen for new users', () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      expect(screen.getByText('Welcome to Authentic Internet')).toBeInTheDocument();
      expect(screen.getByText('The Creative Metaverse Where Your Imagination Becomes Reality')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Discover')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    test('shows artifact type selection after welcome', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Click get started
      const getStartedButton = screen.getByText('Get Started');
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(screen.getByText('Choose Your Creative Path')).toBeInTheDocument();
      });

      expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      expect(screen.getByText('Visual Art')).toBeInTheDocument();
      expect(screen.getByText('Music & Audio')).toBeInTheDocument();
      expect(screen.getByText('Interactive Puzzle')).toBeInTheDocument();
      expect(screen.getByText('Mini Game')).toBeInTheDocument();
    });

    test('allows user to select artifact type', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to type selection
      fireEvent.click(screen.getByText('Get Started'));

      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });

      // Select story type
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Find Your Inspiration')).toBeInTheDocument();
      });
    });

    test('shows inspiration examples', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to inspiration step
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
        expect(screen.getByText('Adventure & Discovery')).toBeInTheDocument();
        expect(screen.getByText('Emotions & Relationships')).toBeInTheDocument();
        expect(screen.getByText('Technology & Innovation')).toBeInTheDocument();
      });
    });

    test('allows user to select inspiration', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to inspiration step
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      // Click on inspiration
      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      // Should show inspiration modal
      await waitFor(() => {
        expect(screen.getByText('Example Artifacts:')).toBeInTheDocument();
      });
    });

    test('shows artifact creation form', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to creation step
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Artifact Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Content')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    test('validates artifact creation form', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to creation step
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const createButton = screen.getByText('Create My Artifact');
      expect(createButton).toBeDisabled();

      // Fill required fields
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'My First Story' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'Once upon a time...' }
      });

      // Button should be enabled
      expect(createButton).not.toBeDisabled();
    });

    test('submits artifact creation successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, artifact: { id: 'test-123' } })
      });

      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Navigate to creation step
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'My First Story' }
      });

      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'A tale of adventure' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'Once upon a time...' }
      });

      fireEvent.change(screen.getByLabelText('Tags'), {
        target: { value: 'story, adventure' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Create My Artifact'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/artifacts', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('My First Story')
        }));
      });
    });

    test('shows discovery step after artifact creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, artifact: { id: 'test-123' } })
      });

      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Complete the flow
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'My First Story' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'Once upon a time...' }
      });

      fireEvent.click(screen.getByText('Create My Artifact'));

      await waitFor(() => {
        expect(screen.getByText('Share and Discover')).toBeInTheDocument();
      });

      expect(screen.getByText('Share Your Creation')).toBeInTheDocument();
      expect(screen.getByText('Discover Others')).toBeInTheDocument();
      expect(screen.getByText('Connect & Collaborate')).toBeInTheDocument();
    });

    test('shows celebration step and completes onboarding', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, artifact: { id: 'test-123' } })
      });

      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Complete the flow
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'My First Story' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'Once upon a time...' }
      });

      fireEvent.click(screen.getByText('Create My Artifact'));

      await waitFor(() => {
        expect(screen.getByText('Share and Discover')).toBeInTheDocument();
      });

      // Continue to celebration
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('🎉 Congratulations! 🎉')).toBeInTheDocument();
      });

      expect(screen.getByText('You\'ve Created Your First Artifact')).toBeInTheDocument();
      expect(screen.getByText('First Creator')).toBeInTheDocument();
      expect(screen.getByText('Start Playing')).toBeInTheDocument();
      expect(screen.getByText('Create More')).toBeInTheDocument();
    });

    test('allows user to skip onboarding', async () => {
      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Click skip button
      const skipButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(skipButton);

      expect(mockOnSkip).toHaveBeenCalled();
    });

    test('saves onboarding completion to localStorage', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, artifact: { id: 'test-123' } })
      });

      renderWithProviders(
        <OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />
      );

      // Complete the flow
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'My First Story' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'Once upon a time...' }
      });

      fireEvent.click(screen.getByText('Create My Artifact'));

      await waitFor(() => {
        expect(screen.getByText('Share and Discover')).toBeInTheDocument();
      });

      // Continue to celebration
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('🎉 Congratulations! 🎉')).toBeInTheDocument();
      });

      // Complete onboarding
      fireEvent.click(screen.getByText('Start Playing'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith('onboardingCompleted', 'true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('firstArtifactCreated', 'true');
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('OnboardingTrigger Component', () => {
    test('shows welcome prompt for first-time visitors', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderWithProviders(<OnboardingTrigger />);

      expect(screen.getByText('Welcome to Authentic Internet!')).toBeInTheDocument();
      expect(screen.getByText('Create amazing content')).toBeInTheDocument();
      expect(screen.getByText('Get discovered by others')).toBeInTheDocument();
      expect(screen.getByText('Build your creative reputation')).toBeInTheDocument();
    });

    test('shows creation prompt for users who completed onboarding but haven\'t created', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('true') // hasVisitedBefore
        .mockReturnValueOnce('true') // onboardingCompleted
        .mockReturnValueOnce(null);  // hasCreatedArtifacts

      renderWithProviders(<OnboardingTrigger />);

      expect(screen.getByText('Ready to Create Your First Artifact?')).toBeInTheDocument();
      expect(screen.getByText('Write a Story')).toBeInTheDocument();
      expect(screen.getByText('Create Art')).toBeInTheDocument();
      expect(screen.getByText('Compose Music')).toBeInTheDocument();
    });

    test('shows inspiration prompt for returning users', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('true') // hasVisitedBefore
        .mockReturnValueOnce('true') // onboardingCompleted
        .mockReturnValueOnce('true'); // hasCreatedArtifacts

      renderWithProviders(<OnboardingTrigger />);

      expect(screen.getByText('Looking for Inspiration?')).toBeInTheDocument();
      expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      expect(screen.getByText('Adventure & Discovery')).toBeInTheDocument();
      expect(screen.getByText('Emotions & Relationships')).toBeInTheDocument();
    });

    test('allows users to dismiss prompts', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderWithProviders(<OnboardingTrigger />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Welcome to Authentic Internet!')).not.toBeInTheDocument();
    });

    test('triggers onboarding flow when user clicks create', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderWithProviders(<OnboardingTrigger />);

      const createButton = screen.getByText('Start Creating');
      fireEvent.click(createButton);

      // Should show onboarding flow
      expect(screen.getByText('Welcome to Authentic Internet')).toBeInTheDocument();
    });

    test('shows success message after onboarding completion', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderWithProviders(<OnboardingTrigger />);

      // This would require more complex setup to test the full flow
      // For now, we test that the component renders correctly
      expect(screen.getByText('Welcome to Authentic Internet!')).toBeInTheDocument();
    });
  });

  describe('Onboarding Integration', () => {
    test('onboarding flow integrates with artifact creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, artifact: { id: 'test-123' } })
      });

      renderWithProviders(
        <OnboardingFlow onComplete={jest.fn()} onSkip={jest.fn()} />
      );

      // Complete the flow
      fireEvent.click(screen.getByText('Get Started'));
      await waitFor(() => {
        expect(screen.getByText('Interactive Story')).toBeInTheDocument();
      });
      
      const storyCard = screen.getByText('Interactive Story').closest('.type-card');
      fireEvent.click(storyCard);

      await waitFor(() => {
        expect(screen.getByText('Nature & Environment')).toBeInTheDocument();
      });

      const natureCard = screen.getByText('Nature & Environment').closest('.inspiration-card');
      fireEvent.click(natureCard);

      await waitFor(() => {
        expect(screen.getByText('Use This Inspiration')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Use This Inspiration'));

      await waitFor(() => {
        expect(screen.getByText('Create Your First Artifact')).toBeInTheDocument();
      });

      // Fill form with meaningful content
      fireEvent.change(screen.getByLabelText('Artifact Name'), {
        target: { value: 'The Whispering Trees' }
      });

      fireEvent.change(screen.getByLabelText('Description'), {
        target: { value: 'A story about trees that can communicate with humans' }
      });

      fireEvent.change(screen.getByLabelText('Content'), {
        target: { value: 'In a forest where ancient trees hold the wisdom of centuries, a young explorer discovers they can hear the trees speaking...' }
      });

      fireEvent.change(screen.getByLabelText('Tags'), {
        target: { value: 'nature, fantasy, communication, wisdom' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Create My Artifact'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/artifacts', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('The Whispering Trees')
        }));
      });
    });

    test('onboarding provides valuable guidance for artifact creation', () => {
      renderWithProviders(
        <OnboardingFlow onComplete={jest.fn()} onSkip={jest.fn()} />
      );

      // Check that the onboarding provides specific guidance
      fireEvent.click(screen.getByText('Get Started'));

      // Type selection provides clear examples
      expect(screen.getByText('Choose-your-own-adventure')).toBeInTheDocument();
      expect(screen.getByText('Poetry collection')).toBeInTheDocument();
      expect(screen.getByText('Character backstory')).toBeInTheDocument();

      // Inspiration provides specific prompts
      expect(screen.getByText('Write a story about a character discovering a hidden world')).toBeInTheDocument();
      expect(screen.getByText('Create a poem about your favorite place')).toBeInTheDocument();
      expect(screen.getByText('Develop a character who has a unique power or ability')).toBeInTheDocument();
    });
  });
}); 