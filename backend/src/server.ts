import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

/**
 * Server entry point.
 *
 * Responsibilities:
 * 1. Start the HTTP server
 * 2. Handle graceful shutdown (close DB connections cleanly)
 * 3. Handle uncaught exceptions and unhandled rejections
 *
 * This is the ONLY file that calls app.listen().
 */

const startServer = async (): Promise<void> => {
  try {
    // Verify database connection before starting
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(env.PORT, () => {
      console.log(`
  🚀 Trackra API is running!
  
  📡 Server:      http://localhost:${env.PORT}
  🌍 Environment: ${env.NODE_ENV}
  🏥 Health:      http://localhost:${env.PORT}/api/health
  🔐 Auth:        http://localhost:${env.PORT}/api/auth/google
      `);
    });

    // ────────────────────────────────────────────────────────
    // Graceful shutdown
    // ────────────────────────────────────────────────────────

    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        console.log('🔌 HTTP server closed');

        // Disconnect from database
        await prisma.$disconnect();
        console.log('🗄️  Database disconnected');

        console.log('👋 Shutdown complete. Goodbye!');
        process.exit(0);
      });

      // Force shutdown if graceful takes too long (10 seconds)
      setTimeout(() => {
        console.error('❌ Could not close connections in time. Forcing shutdown.');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// ────────────────────────────────────────────────────────
// Global error safety nets
// ────────────────────────────────────────────────────────

// Catch any exception that wasn't caught by try/catch or asyncHandler
process.on('uncaughtException', (error: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1); // The process is in an undefined state — must restart
});

// Catch any promise rejection that wasn't caught by .catch()
process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// Start the server
startServer();
