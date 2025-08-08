import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logging";

// Import routes (auth and forum routes enabled)
import authRoutes from "./routes/auth";
import forumRoutes from "./routes/forum";
import forumImageRoutes from "./routes/forumImages";
import forumModerationRoutes from "./routes/forumModeration";
// import userRoutes from "./routes/users";
import vehicleRoutes from "./routes/vehicles";
import vehicleListingRoutes from "./routes/vehicleListings";
import evListingRoutes from "./routes/evListings";
// import marketplaceRoutes from "./routes/marketplace";

import blogRoutes from "./routes/blog";
// import chargingStationRoutes from "./routes/chargingStations";
// import directoryRoutes from "./routes/directory";
import likeRoutes from "./routes/likes";
// import messageRoutes from "./routes/messages";
// import notificationRoutes from "./routes/notifications";
// import adminRoutes from "./routes/admin";
// import adminVehicleListingRoutes from "./routes/adminVehicleListings";
// import reviewRoutes from "./routes/reviews";
// import searchRoutes from "./routes/search";
import uploadRoutes from "./routes/upload";
// import wantedRoutes from "./routes/wanted";

// All routes are now converted to TypeScript! 🎉

const app: Application = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://localhost:3000",
      "https://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean) as string[];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Custom request logger (temporarily disabled)
// app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/health" || req.path === "/api/health";
  },
});

// Apply rate limiting to API routes
app.use("/api/", generalLimiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API routes (auth and forum routes enabled)
app.use("/api/auth", authRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/forum/images", forumImageRoutes);
app.use("/api/forum/moderation", forumModerationRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vehicle-listings", vehicleListingRoutes);
app.use("/api/ev-listings", evListingRoutes);
// app.use("/api/marketplace", marketplaceRoutes);

app.use("/api/blog", blogRoutes);
// app.use("/api/charging-stations", chargingStationRoutes);
// app.use("/api/directory", directoryRoutes);
app.use("/api/likes", likeRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/admin/vehicle-listings", adminVehicleListingRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
// app.use("/api/wanted", wantedRoutes);

// All routes are now active and converted to TypeScript! 🎉

// API documentation endpoint
app.get("/api", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "EV Community Platform API",
    version: "1.0.0",
    documentation: {
      auth: "/api/auth - Authentication endpoints",
      users: "/api/users - User management",
      vehicles: "/api/vehicles - Vehicle management",
      evListings: "/api/ev-listings - EV listings",
      marketplace: "/api/marketplace - Marketplace listings",
      wanted: "/api/wanted - Wanted ads",

      blog: "/api/blog - Blog posts and articles",
      chargingStations: "/api/charging-stations - EV charging station data",
      directory: "/api/directory - Business directory",
      reviews: "/api/reviews - User reviews and ratings",
      likes: "/api/likes - Content likes and reactions",
      messages: "/api/messages - Private messaging",
      upload: "/api/upload - File upload management",
      search: "/api/search - Search functionality",
      notifications: "/api/notifications - User notifications",
      admin: "/api/admin - Administrative functions",
    },
    endpoints: {
      health: "/health - Health check",
      docs: "/api - This documentation",
    },
  });
});

// Welcome route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to EV Community Platform API",
    version: "1.0.0",
    documentation: "/api",
    health: "/health",
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public")));

  // Catch all handler for SPA routing
  app.get("*", (req: Request, res: Response) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith("/api/")) {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    } else {
      res.status(404).json({
        success: false,
        message: "API endpoint not found",
      });
    }
  });
}

// 404 handler for API routes
app.use("/api/*", notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
