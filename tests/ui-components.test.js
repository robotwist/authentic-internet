/**
 * UI Components Test Suite for Unified Artifact Model
 * 
 * This test suite verifies that all UI components properly handle
 * the unified artifact model with both new and legacy fields.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock components and contexts
jest.mock('../client/src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', username: 'testuser' },
    token: 'test-token'
  })
}));

jest.mock('../client/src/utils/SoundManager', () => ({
  getInstance: jest.fn(() => ({
    initialize: jest.fn(),
    playSound: jest.fn()
  }))
}));

// Import components to test
import ArtifactForm from '../client/src/components/ArtifactForm';
import Artifact from '../client/src/components/Artifact';
import ArtifactCard from '../client/src/components/ArtifactCard';
import Inventory from '../client/src/components/Inventory';
import ArtifactDetails from '../client/src/components/ArtifactDetails';

describe('Unified Artifact Model - UI Components', () => {
  
  // Sample unified artifact data
  const unifiedArtifact = {
    _id: 'artifact-001',
    name: 'Ancient Sword',
    description: 'A legendary blade that once belonged to a great warrior',
    type: 'WEAPON',
    content: 'The sword pulses with ancient power, its edge never dulling.',
    media: ['/assets/artifacts/ancient_sword.png'],
    location: { x: 3, y: 2, mapName: 'Overworld' },
    exp: 15,
    visible: true,
    area: 'Overworld',
    tags: ['legendary', 'weapon', 'warrior'],
    rating: 4.7,
    reviews: [
      { userId: 'user-002', rating: 5, comment: 'Incredible artifact!', createdAt: '2024-06-02T10:00:00Z' }
    ],
    createdBy: 'user-001',
    createdAt: '2024-06-01T12:00:00Z',
    updatedAt: '2024-06-01T12:00:00Z'
  };

  // Sample legacy artifact data
  const legacyArtifact = {
    _id: 'artifact-002',
    name: 'Old Scroll',
    description: 'An ancient scroll with mysterious text',
    type: 'artifact',
    x: 5,
    y: 7,
    exp: 10,
    messageText: 'You feel a strange energy emanating from the scroll.',
    creator: 'user-003',
    area: 'Dungeon'
  };

  describe('ArtifactForm Component', () => {
    test('renders with unified model fields', () => {
      const mockOnSubmit = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <ArtifactForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          currentArea="Overworld"
        />
      );

      // Check for core unified model fields
      expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Type \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Experience Points/)).toBeInTheDocument();
      expect(screen.getByText(/Tags & Discovery/)).toBeInTheDocument();
    });

    test('submits unified model data correctly', async () => {
      const mockOnSubmit = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <ArtifactForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          currentArea="Overworld"
        />
      );

      // Fill in form data
      fireEvent.change(screen.getByLabelText(/Name \*/), {
        target: { value: 'Test Artifact' }
      });
      fireEvent.change(screen.getByLabelText(/Description \*/), {
        target: { value: 'A test artifact' }
      });
      fireEvent.change(screen.getByLabelText(/Content \*/), {
        target: { value: 'This is test content' }
      });
      fireEvent.change(screen.getByLabelText(/Type \*/), {
        target: { value: 'WEAPON' }
      });

      // Submit form
      fireEvent.click(screen.getByText(/Create Artifact/));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Artifact',
            description: 'A test artifact',
            content: 'This is test content',
            type: 'WEAPON',
            location: { x: 0, y: 0, mapName: 'Overworld' },
            area: 'Overworld',
            exp: 10,
            tags: [],
            media: []
          })
        );
      });
    });

    test('handles legacy data for editing', () => {
      const mockOnSubmit = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <ArtifactForm
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
          initialData={legacyArtifact}
          isEditing={true}
          currentArea="Dungeon"
        />
      );

      // Check that legacy fields are populated
      expect(screen.getByDisplayValue('Old Scroll')).toBeInTheDocument();
      expect(screen.getByDisplayValue('An ancient scroll with mysterious text')).toBeInTheDocument();
      expect(screen.getByDisplayValue('You feel a strange energy emanating from the scroll.')).toBeInTheDocument();
    });
  });

  describe('Artifact Component', () => {
    test('renders unified model artifact correctly', () => {
      const mockOnPickup = jest.fn();
      const characterPosition = { x: 3, y: 2 };

      render(
        <Artifact
          artifact={unifiedArtifact}
          onPickup={mockOnPickup}
          characterPosition={characterPosition}
        />
      );

      // Check that artifact is positioned correctly using location object
      const artifactElement = screen.getByAltText('Ancient Sword');
      expect(artifactElement).toBeInTheDocument();
    });

    test('renders legacy artifact correctly', () => {
      const mockOnPickup = jest.fn();
      const characterPosition = { x: 5, y: 7 };

      render(
        <Artifact
          artifact={legacyArtifact}
          onPickup={mockOnPickup}
          characterPosition={characterPosition}
        />
      );

      // Check that artifact is positioned correctly using x/y coordinates
      const artifactElement = screen.getByAltText('Old Scroll');
      expect(artifactElement).toBeInTheDocument();
    });

    test('displays unified model fields in details', () => {
      const mockOnPickup = jest.fn();
      const characterPosition = { x: 3, y: 2 };

      render(
        <Artifact
          artifact={unifiedArtifact}
          onPickup={mockOnPickup}
          characterPosition={characterPosition}
        />
      );

      // Click on artifact to show details
      fireEvent.click(screen.getByAltText('Ancient Sword'));

      // Check for unified model fields
      expect(screen.getByText('Type: Weapon')).toBeInTheDocument();
      expect(screen.getByText('Reward: +15 XP')).toBeInTheDocument();
      expect(screen.getByText('legendary')).toBeInTheDocument();
      expect(screen.getByText('weapon')).toBeInTheDocument();
      expect(screen.getByText('warrior')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4.7 ⭐')).toBeInTheDocument();
    });
  });

  describe('ArtifactCard Component', () => {
    test('renders unified model artifact card', () => {
      const mockOnVote = jest.fn();
      const mockOnComment = jest.fn();
      const mockOnView = jest.fn();
      const mockOnShare = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnEdit = jest.fn();

      render(
        <ArtifactCard
          artifact={unifiedArtifact}
          onVote={mockOnVote}
          onComment={mockOnComment}
          onView={mockOnView}
          onShare={mockOnShare}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      // Check for unified model fields
      expect(screen.getByText('Ancient Sword')).toBeInTheDocument();
      expect(screen.getByText('Weapon')).toBeInTheDocument();
      expect(screen.getByText('By user-001')).toBeInTheDocument();
    });

    test('displays media from unified model', () => {
      const mockOnVote = jest.fn();
      const mockOnComment = jest.fn();
      const mockOnView = jest.fn();
      const mockOnShare = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnEdit = jest.fn();

      render(
        <ArtifactCard
          artifact={unifiedArtifact}
          onVote={mockOnVote}
          onComment={mockOnComment}
          onView={mockOnView}
          onShare={mockOnShare}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      // Click to expand
      fireEvent.click(screen.getByText('Ancient Sword'));

      // Check for media display
      const mediaImage = screen.getByAltText('Ancient Sword');
      expect(mediaImage).toHaveAttribute('src', '/assets/artifacts/ancient_sword.png');
    });

    test('displays experience and tags', () => {
      const mockOnVote = jest.fn();
      const mockOnComment = jest.fn();
      const mockOnView = jest.fn();
      const mockOnShare = jest.fn();
      const mockOnDelete = jest.fn();
      const mockOnEdit = jest.fn();

      render(
        <ArtifactCard
          artifact={unifiedArtifact}
          onVote={mockOnVote}
          onComment={mockOnComment}
          onView={mockOnView}
          onShare={mockOnShare}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      // Click to expand
      fireEvent.click(screen.getByText('Ancient Sword'));

      // Check for unified model fields
      expect(screen.getByText('Reward: +15 XP')).toBeInTheDocument();
      expect(screen.getByText('legendary')).toBeInTheDocument();
      expect(screen.getByText('weapon')).toBeInTheDocument();
      expect(screen.getByText('warrior')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4.7 ⭐')).toBeInTheDocument();
    });
  });

  describe('Inventory Component', () => {
    test('displays unified model artifacts in inventory', () => {
      const mockOnClose = jest.fn();
      const artifacts = [unifiedArtifact, legacyArtifact];

      render(
        <Inventory
          artifacts={artifacts}
          onClose={mockOnClose}
        />
      );

      // Check for unified model fields
      expect(screen.getByText('Ancient Sword')).toBeInTheDocument();
      expect(screen.getByText('Weapon')).toBeInTheDocument();
      expect(screen.getByText('+15 XP')).toBeInTheDocument();
      expect(screen.getByText('legendary')).toBeInTheDocument();
      expect(screen.getByText('weapon')).toBeInTheDocument();
      expect(screen.getByText('warrior')).toBeInTheDocument();

      // Check for legacy artifact
      expect(screen.getByText('Old Scroll')).toBeInTheDocument();
    });

    test('handles artifacts with media attachments', () => {
      const mockOnClose = jest.fn();
      const artifactsWithMedia = [
        {
          ...unifiedArtifact,
          media: ['/assets/artifacts/ancient_sword.png', '/assets/artifacts/sword_glow.mp4']
        }
      ];

      render(
        <Inventory
          artifacts={artifactsWithMedia}
          onClose={mockOnClose}
        />
      );

      // Check for attachment badge
      expect(screen.getByTitle('Has attachment')).toBeInTheDocument();
    });
  });

  describe('ArtifactDetails Component', () => {
    test('renders unified model artifact details', () => {
      const mockOnClose = jest.fn();
      const mockOnCollect = jest.fn();

      render(
        <ArtifactDetails
          artifact={unifiedArtifact}
          onClose={mockOnClose}
          onCollect={mockOnCollect}
        />
      );

      // Check for unified model fields
      expect(screen.getByText('Ancient Sword')).toBeInTheDocument();
      expect(screen.getByText('Weapon')).toBeInTheDocument();
      expect(screen.getByText('A legendary blade that once belonged to a great warrior')).toBeInTheDocument();
      expect(screen.getByText('Experience: +15 XP')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('legendary')).toBeInTheDocument();
      expect(screen.getByText('weapon')).toBeInTheDocument();
      expect(screen.getByText('warrior')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4.7 ⭐')).toBeInTheDocument();
      expect(screen.getByText('Created by: user-001')).toBeInTheDocument();
    });

    test('displays media gallery for unified model', () => {
      const mockOnClose = jest.fn();
      const mockOnCollect = jest.fn();

      render(
        <ArtifactDetails
          artifact={unifiedArtifact}
          onClose={mockOnClose}
          onCollect={mockOnCollect}
        />
      );

      // Check for media section
      expect(screen.getByText('Media')).toBeInTheDocument();
      const mediaImage = screen.getByAltText('Ancient Sword media 1');
      expect(mediaImage).toHaveAttribute('src', '/assets/artifacts/ancient_sword.png');
    });

    test('handles legacy artifact details', () => {
      const mockOnClose = jest.fn();
      const mockOnCollect = jest.fn();

      render(
        <ArtifactDetails
          artifact={legacyArtifact}
          onClose={mockOnClose}
          onCollect={mockOnCollect}
        />
      );

      // Check for legacy fields
      expect(screen.getByText('Old Scroll')).toBeInTheDocument();
      expect(screen.getByText('An ancient scroll with mysterious text')).toBeInTheDocument();
      expect(screen.getByText('Experience: +10 XP')).toBeInTheDocument();
    });
  });

  describe('Cross-Component Compatibility', () => {
    test('components work together with unified model', () => {
      // Test that all components can handle the same unified artifact data
      const artifacts = [unifiedArtifact];

      // Test ArtifactForm can create unified artifacts
      const mockOnSubmit = jest.fn();
      const { rerender } = render(
        <ArtifactForm
          onSubmit={mockOnSubmit}
          onClose={jest.fn()}
          currentArea="Overworld"
        />
      );

      // Test Artifact can display unified artifacts
      rerender(
        <Artifact
          artifact={unifiedArtifact}
          onPickup={jest.fn()}
          characterPosition={{ x: 3, y: 2 }}
        />
      );

      // Test ArtifactCard can display unified artifacts
      rerender(
        <ArtifactCard
          artifact={unifiedArtifact}
          onVote={jest.fn()}
          onComment={jest.fn()}
          onView={jest.fn()}
          onShare={jest.fn()}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      );

      // Test Inventory can display unified artifacts
      rerender(
        <Inventory
          artifacts={artifacts}
          onClose={jest.fn()}
        />
      );

      // Test ArtifactDetails can display unified artifacts
      rerender(
        <ArtifactDetails
          artifact={unifiedArtifact}
          onClose={jest.fn()}
          onCollect={jest.fn()}
        />
      );

      // All components should render without errors
      expect(screen.getByText('Ancient Sword')).toBeInTheDocument();
    });

    test('backward compatibility with legacy artifacts', () => {
      // Test that all components can handle legacy artifact data
      const artifacts = [legacyArtifact];

      // Test Artifact can display legacy artifacts
      const { rerender } = render(
        <Artifact
          artifact={legacyArtifact}
          onPickup={jest.fn()}
          characterPosition={{ x: 5, y: 7 }}
        />
      );

      // Test ArtifactCard can display legacy artifacts
      rerender(
        <ArtifactCard
          artifact={legacyArtifact}
          onVote={jest.fn()}
          onComment={jest.fn()}
          onView={jest.fn()}
          onShare={jest.fn()}
          onDelete={jest.fn()}
          onEdit={jest.fn()}
        />
      );

      // Test Inventory can display legacy artifacts
      rerender(
        <Inventory
          artifacts={artifacts}
          onClose={jest.fn()}
        />
      );

      // Test ArtifactDetails can display legacy artifacts
      rerender(
        <ArtifactDetails
          artifact={legacyArtifact}
          onClose={jest.fn()}
          onCollect={jest.fn()}
        />
      );

      // All components should render without errors
      expect(screen.getByText('Old Scroll')).toBeInTheDocument();
    });
  });
}); 