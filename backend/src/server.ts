import app from "./app";
import { supabaseAdmin } from "./services/supabaseClient";
import * as portfinder from "portfinder";
import { Server } from "http";

// Test database connection
const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("❌ Database connection failed:", error.message);
      return false;
    }

    console.log("✅ Database connection successful");
    return true;
  } catch (error: any) {
    console.error("❌ Database connection error:", error.message);
    return false;
  }
};

// Start server
const startServer = async (): Promise<void> => {
  const preferredPort = parseInt(process.env.PORT || "5000", 10);

  try {
    // Test database connection before starting server
    console.log("🔍 Testing database connection...");
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      console.error("❌ Failed to connect to database. Server will not start.");
      process.exit(1);
    }

    // Find an available port
    portfinder.setBasePort(preferredPort);
    const PORT = await portfinder.getPortPromise();

    if (PORT !== preferredPort) {
      console.log(
        `⚠️  Port ${preferredPort} is in use, using port ${PORT} instead`
      );
    }

    // Start the server
    const server: Server = app.listen(PORT, () => {
      console.log("🚀 Server started successfully!");
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);

      if (process.env.NODE_ENV === "development") {
        console.log("\n📚 Available API endpoints:");
        console.log("   • Authentication: /api/auth");
        console.log("   • Users: /api/users");
        console.log("   • Vehicles: /api/vehicles");
        console.log("   • Vehicle Listings: /api/vehicle-listings");
        console.log("   • EV Listings: /api/ev-listings");
        console.log("   • Forum: /api/forum");
        console.log("   • Forum Images: /api/forum/images");
        console.log("   • Forum Moderation: /api/forum/moderation");
        console.log("   • Blog: /api/blog");
        console.log("   • Reviews: /api/reviews");
        console.log("   • Likes: /api/likes");
        console.log("   • Upload: /api/upload");
        console.log("   • Admin: /api/admin");
        console.log(
          "\n📖 Full API documentation: http://localhost:" + PORT + "/api"
        );
      }
    });

    // Handle server errors
    server.on("error", (error: Error) => {
      console.error("❌ Server error:", error.message);
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string): void => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

      server.close((err?: Error) => {
        if (err) {
          console.error("❌ Error during server shutdown:", err);
          process.exit(1);
        }

        console.log("✅ Server closed successfully");
        console.log("👋 Goodbye!");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error: any) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("Stack trace:", error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
