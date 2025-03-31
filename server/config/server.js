const DEFAULT_PORT = process.env.PORT || 5001;
const MAX_PORT_ATTEMPTS = 1;  // Only try the default port

const initializeServer = async () => {
  try {
    const server = app.listen(DEFAULT_PORT, () => {
      console.log(`🚀 Server running on port ${DEFAULT_PORT}`);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Configured' : 'Missing');
      console.log('🔌 WebSockets:', process.env.ENABLE_WEBSOCKETS ? 'Enabled' : 'Disabled');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ... existing code ... 