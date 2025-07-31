import app from './app';
import { supabaseAdmin } from './services/supabaseClient';
import * as portfinder from 'portfinder';

// Test database connection
const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
};

// Start server
const startServer = async (): Promise<void> => {
  const preferredPort = parseInt(process.env.PORT || '5000', 10);
  
  try {
    // Test database connection before starting server
    console.log('🔍 Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server will not start.');
      process.exit(1);
    }
    
    // Find an available port
    portfinder.setBasePort(preferredPort);
    const PORT = await portfinder.getPortPromise();
    
    if (PORT !== preferredPort) {
      console.log(`⚠️  Port ${preferredPort} is in use, using port ${PORT} instead`);
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📚 Available API endpoints:');
        console.log('   • Authentication: /api/auth');
        console.log('   • Users: /api/users');
        console.log('   • Vehicles: /api/vehicles');
        console.log('   • Marketplace: /api/marketplace');
        console.log('   • Wanted Ads: /api/wanted');
        console.log('   • Forum: /api/forum');
        console.log('   • Blog: /api/blog');
        console.log('   • Charging Stations: /api/charging-stations');
        console.log('   • Directory: /api/directory');
        console.log('   • Reviews: /api/reviews');
        console.log('   • Likes: /api/likes');
        console.log('   • Messages: /api/messages');
        console.log('   • Upload: /api/upload');
        console.log('   • Notifications: /api/notifications');
        console.log('   • Admin: /api/admin');
        console.log('\n📖 Full API documentation: http://localhost:' + PORT + '/api');
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      process.exit(1);
    });
    
    // Graceful shutdown
    const gracefulShutdown = (signal: string): void => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        console.log('👋 Goodbye!');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error): void => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>): void => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;