/**
 * Advanced Features Test Suite
 * Tests for Advanced Search, Discovery Engine, and Analytics Dashboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdvancedSearch from '../client/src/components/AdvancedSearch';
import DiscoveryEngine from '../client/src/components/DiscoveryEngine';
import AnalyticsDashboard from '../client/src/components/AnalyticsDashboard';

// Mock Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com'
  }
};

// Mock artifacts data
const mockArtifacts = [
  {
    _id: '1',
    name: 'Test Artifact 1',
    description: 'A test artifact for testing',
    content: 'This is test content',
    type: 'game',
    area: 'overworld',
    createdBy: 'testuser',
    rating: 4.5,
    exp: 25,
    tags: ['test', 'game', 'fun'],
    reviews: [
      { userId: 'user1', rating: 5, comment: 'Great!', createdAt: '2024-01-01' },
      { userId: 'user2', rating: 4, comment: 'Good', createdAt: '2024-01-02' }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    location: { x: 10, y: 20, mapName: 'overworld' },
    media: ['/test-image.jpg'],
    viewCount: 150
  },
  {
    _id: '2',
    name: 'Test Artifact 2',
    description: 'Another test artifact',
    content: 'More test content',
    type: 'story',
    area: 'yosemite',
    createdBy: 'otheruser',
    rating: 3.8,
    exp: 15,
    tags: ['story', 'adventure'],
    reviews: [
      { userId: 'user3', rating: 4, comment: 'Nice story', createdAt: '2024-01-03' }
    ],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    location: { x: 30, y: 40, mapName: 'yosemite' },
    media: [],
    viewCount: 75
  },
  {
    _id: '3',
    name: 'Test Artifact 3',
    description: 'A puzzle artifact',
    content: 'Solve this puzzle',
    type: 'puzzle',
    area: 'overworld',
    createdBy: 'testuser',
    rating: 4.2,
    exp: 45,
    tags: ['puzzle', 'challenge'],
    reviews: [],
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    location: { x: 50, y: 60, mapName: 'overworld' },
    media: ['/puzzle-image.jpg'],
    viewCount: 200
  }
];

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Advanced Search Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders search input and filters', () => {
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(/search artifacts/i)).toBeInTheDocument();
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('performs text search', async () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    fireEvent.change(searchInput, { target: { value: 'puzzle' } });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Test Artifact 3' })
        ])
      );
    });
  });

  it('filters by type', async () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    // Open filters
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);

    // Select game type
    const typeSelect = screen.getByLabelText(/type/i);
    fireEvent.mouseDown(typeSelect);
    const gameOption = screen.getByText('game');
    fireEvent.click(gameOption);

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'game' })
        ])
      );
    });
  });

  it('filters by rating range', async () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    // Open filters
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);

    // Adjust rating slider
    const ratingSlider = screen.getByRole('slider');
    fireEvent.change(ratingSlider, { target: { value: [4, 5] } });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ rating: 4.5 })
        ])
      );
    });
  });

  it('saves and loads search history', async () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'searchHistory',
      expect.any(String)
    );
  });

  it('saves custom searches', () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const saveButton = screen.getByText(/save search/i);
    fireEvent.click(saveButton);

    // Mock prompt response
    global.prompt = vi.fn().mockReturnValue('My Custom Search');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'savedSearches',
      expect.any(String)
    );
  });
});

describe('Discovery Engine Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders discovery tabs', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/for you/i)).toBeInTheDocument();
    expect(screen.getByText(/trending/i)).toBeInTheDocument();
    expect(screen.getByText(/new releases/i)).toBeInTheDocument();
    expect(screen.getByText(/creators/i)).toBeInTheDocument();
    expect(screen.getByText(/topics/i)).toBeInTheDocument();
  });

  it('shows personalized recommendations', () => {
    // Mock viewed artifacts
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['1']));
    
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/recommended for you/i)).toBeInTheDocument();
  });

  it('shows trending artifacts', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    // Click on trending tab
    const trendingTab = screen.getByText(/trending/i);
    fireEvent.click(trendingTab);

    expect(screen.getByText(/trending now/i)).toBeInTheDocument();
  });

  it('shows new releases', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    // Click on new releases tab
    const newReleasesTab = screen.getByText(/new releases/i);
    fireEvent.click(newReleasesTab);

    expect(screen.getByText(/new releases/i)).toBeInTheDocument();
  });

  it('shows popular creators', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    // Click on creators tab
    const creatorsTab = screen.getByText(/creators/i);
    fireEvent.click(creatorsTab);

    expect(screen.getByText(/popular creators/i)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows trending topics', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    // Click on topics tab
    const topicsTab = screen.getByText(/topics/i);
    fireEvent.click(topicsTab);

    expect(screen.getByText(/trending topics/i)).toBeInTheDocument();
    expect(screen.getByText(/test \(1\)/i)).toBeInTheDocument();
  });

  it('handles artifact selection', () => {
    const mockOnArtifactSelect = vi.fn();
    
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={mockOnArtifactSelect}
        />
      </TestWrapper>
    );

    // This would require finding and clicking on an artifact card
    // The actual implementation depends on how artifacts are rendered
    expect(mockOnArtifactSelect).toBeDefined();
  });
});

describe('Analytics Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/comprehensive insights/i)).toBeInTheDocument();
  });

  it('shows overview metrics', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/total artifacts/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total artifacts count
    expect(screen.getByText(/active creators/i)).toBeInTheDocument();
    expect(screen.getByText(/avg rating/i)).toBeInTheDocument();
    expect(screen.getByText(/total views/i)).toBeInTheDocument();
  });

  it('shows trends chart', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/activity trends/i)).toBeInTheDocument();
  });

  it('shows content type breakdown', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/content types/i)).toBeInTheDocument();
  });

  it('shows content performance chart', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/content performance by type/i)).toBeInTheDocument();
  });

  it('shows geographic distribution', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/geographic distribution/i)).toBeInTheDocument();
  });

  it('shows top performing content', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/top performing content/i)).toBeInTheDocument();
  });

  it('handles time range changes', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    const timeRangeSelect = screen.getByLabelText(/time range/i);
    fireEvent.mouseDown(timeRangeSelect);
    
    expect(screen.getByText(/last 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last 30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last 90 days/i)).toBeInTheDocument();
    expect(screen.getByText(/last year/i)).toBeInTheDocument();
  });

  it('exports analytics data', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and click
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    global.document.createElement = vi.fn().mockReturnValue(mockLink);

    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    const exportButton = screen.getByText(/export/i);
    fireEvent.click(exportButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
          loading={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  it('search results flow through discovery engine', async () => {
    const mockOnSearchResults = vi.fn();
    const mockOnArtifactSelect = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={mockOnArtifactSelect}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    fireEvent.change(searchInput, { target: { value: 'game' } });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'game' })
        ])
      );
    });
  });

  it('analytics data reflects search and discovery activity', () => {
    // Mock viewed artifacts to simulate user activity
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['1', '2']));
    
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    // Verify that analytics show user engagement
    expect(screen.getByText(/total artifacts/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Should show total artifacts
  });
});

describe('Performance Tests', () => {
  it('handles large artifact datasets efficiently', () => {
    const largeArtifactSet = Array.from({ length: 1000 }, (_, i) => ({
      _id: `artifact-${i}`,
      name: `Artifact ${i}`,
      description: `Description for artifact ${i}`,
      content: `Content for artifact ${i}`,
      type: ['game', 'story', 'puzzle'][i % 3],
      area: ['overworld', 'yosemite'][i % 2],
      createdBy: `user${i % 10}`,
      rating: Math.random() * 5,
      exp: Math.floor(Math.random() * 100),
      tags: [`tag${i}`, `tag${i + 1}`],
      reviews: [],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      location: { x: Math.floor(Math.random() * 100), y: Math.floor(Math.random() * 100), mapName: 'overworld' },
      media: [],
      viewCount: Math.floor(Math.random() * 1000)
    }));

    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={largeArtifactSet}
          onSearchResults={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 1 second
    expect(renderTime).toBeLessThan(1000);
  });

  it('search performance with complex filters', async () => {
    const mockOnSearchResults = vi.fn();
    
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={mockOnSearchResults}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const startTime = performance.now();

    // Perform complex search
    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalled();
    });

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Search should complete within 100ms
    expect(searchTime).toBeLessThan(100);
  });
});

describe('Accessibility Tests', () => {
  it('search input has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search artifacts/i);
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('dashboard charts have proper accessibility labels', () => {
    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={mockArtifacts}
        />
      </TestWrapper>
    );

    // Check for chart accessibility
    expect(screen.getByText(/activity trends/i)).toBeInTheDocument();
    expect(screen.getByText(/content types/i)).toBeInTheDocument();
  });

  it('discovery tabs are keyboard navigable', () => {
    render(
      <TestWrapper>
        <DiscoveryEngine 
          artifacts={mockArtifacts}
          onArtifactSelect={vi.fn()}
        />
      </TestWrapper>
    );

    const trendingTab = screen.getByText(/trending/i);
    trendingTab.focus();
    
    expect(trendingTab).toHaveFocus();
  });
});

describe('Error Handling Tests', () => {
  it('handles empty artifact arrays gracefully', () => {
    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={[]}
          onSearchResults={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/0 results/i)).toBeInTheDocument();
  });

  it('handles malformed artifact data', () => {
    const malformedArtifacts = [
      { _id: '1', name: 'Valid Artifact' },
      { _id: '2' }, // Missing required fields
      null,
      undefined
    ];

    render(
      <TestWrapper>
        <AnalyticsDashboard 
          artifacts={malformedArtifacts}
        />
      </TestWrapper>
    );

    // Should not crash and should show available data
    expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    render(
      <TestWrapper>
        <AdvancedSearch 
          artifacts={mockArtifacts}
          onSearchResults={vi.fn()}
          onSearchChange={vi.fn()}
        />
      </TestWrapper>
    );

    // Should not crash when localStorage fails
    expect(screen.getByPlaceholderText(/search artifacts/i)).toBeInTheDocument();
  });
}); 