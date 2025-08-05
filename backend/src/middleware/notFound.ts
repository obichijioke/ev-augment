import { Request, Response, NextFunction } from "express";
import { createError } from "./errorHandler";

// 404 Not Found middleware
const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    "ROUTE_NOT_FOUND"
  );

  // Add additional context for 404 errors
  (error as any).path = req.path;
  (error as any).method = req.method;
  (error as any).availableRoutes = {
    auth: "/api/auth",
    users: "/api/users",
    vehicles: "/api/vehicles",
    evListings: "/api/ev-listings",
    marketplace: "/api/marketplace",
    wanted: "/api/wanted",

    blog: "/api/blog",
    chargingStations: "/api/charging-stations",
    directory: "/api/directory",
    reviews: "/api/reviews",
    likes: "/api/likes",
    messages: "/api/messages",
    upload: "/api/upload",
    search: "/api/search",
    health: "/health",
  };

  next(error);
};

export { notFound };
export default notFound;
