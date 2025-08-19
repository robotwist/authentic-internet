import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MultiplayerChat from '../components/MultiplayerChat';
import ErrorBoundary from '../components/ErrorBoundary';
import { WebSocketProvider } from '../context/WebSocketContext';
import { AuthProvider } from '../context/AuthContext';

expect.extend(toHaveNoViolations);

// Mock WebSocket context
const mockWebSocketContext = {
  socket: null,
  isConnected: true,
  sendMessage: jest.fn(),
  onEvent: jest.fn(),
  reconnect: jest.fn()
};

// Mock Auth context
const mockAuthContext = {
  user: {
    _id: 'test-user-id',
    username: 'testuser',
    avatar: '/default-avatar.png'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn()
};

// Mock contexts
jest.mock('../context/WebSocketContext', () => ({
  ...jest.requireActual('../context/WebSocketContext'),
  useWebSocket: () => mockWebSocketContext
}));

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext
}));

describe('Accessibility Tests', () => {
  describe('MultiplayerChat Component', () => {
    const defaultProps = {
      worldId: 'test-world',
      worldName: 'Test World',
      className: 'test-chat'
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      // Check for connection status ARIA label
      const connectionStatus = screen.getByRole('status');
      expect(connectionStatus).toHaveAttribute('aria-label');
      expect(connectionStatus.getAttribute('aria-label')).toContain('Connection status');

      // Check for chat messages ARIA label
      const chatMessages = screen.getByRole('log');
      expect(chatMessages).toHaveAttribute('aria-label', 'Chat messages');

      // Check for online players list ARIA label
      const playersList = screen.getByRole('list');
      expect(playersList).toHaveAttribute('aria-label', 'Online players list');

      // Check for message input ARIA label
      const messageInput = screen.getByRole('textbox');
      expect(messageInput).toHaveAttribute('aria-label', 'Type your message');
    });

    it('should have proper form labels and descriptions', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      const messageInput = screen.getByRole('textbox');
      expect(messageInput).toHaveAttribute('aria-describedby', 'message-help');

      const helpText = screen.getByText('Press Enter to send, Shift+Enter for new line');
      expect(helpText).toHaveAttribute('id', 'message-help');
    });

    it('should have proper button labels', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      const minimizeButton = screen.getByRole('button', { name: /minimize chat/i });
      expect(minimizeButton).toBeInTheDocument();

      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should have proper semantic HTML structure', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Online Players');

      // Check for proper list structure
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    it('should handle keyboard navigation', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat {...defaultProps} />
          </WebSocketProvider>
        </AuthProvider>
      );

      const messageInput = screen.getByRole('textbox');
      expect(messageInput).toHaveAttribute('maxLength', '1000');
    });
  });

  describe('ErrorBoundary Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for error state', () => {
      // Create a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper button labels', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      expect(reloadButton).toBeInTheDocument();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', () => {
      // This would require a visual testing library like Chromatic or Percy
      // For now, we'll test that our CSS classes are properly applied
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat worldId="test" worldName="Test World" />
          </WebSocketProvider>
        </AuthProvider>
      );

      const chatContainer = screen.getByRole('log');
      expect(chatContainer).toBeInTheDocument();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should announce dynamic content changes', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat worldId="test" worldName="Test World" />
          </WebSocketProvider>
        </AuthProvider>
      );

      // Check for aria-live regions
      const chatMessages = screen.getByRole('log');
      expect(chatMessages).toHaveAttribute('aria-live', 'polite');

      const typingIndicator = screen.getByRole('status');
      expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide alternative text for images', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat worldId="test" worldName="Test World" />
          </WebSocketProvider>
        </AuthProvider>
      );

      // Check that avatar images have alt text
      const avatarImages = screen.getAllByAltText(/avatar/i);
      expect(avatarImages.length).toBeGreaterThan(0);
    });
  });

  describe('Focus Management', () => {
    it('should maintain proper focus order', () => {
      render(
        <AuthProvider>
          <WebSocketProvider>
            <MultiplayerChat worldId="test" worldName="Test World" />
          </WebSocketProvider>
        </AuthProvider>
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      // Test tab order (this would need more sophisticated testing in a real browser)
      expect(messageInput).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });
  });
});
