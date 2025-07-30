const { createError } = require('./errorHandler');

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = createError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  
  // Add additional context for 404 errors
  error.path = req.path;
  error.method = req.method;
  error.availableRoutes = {
    auth: '/api/auth',
    users: '/api/users',
    vehicles: '/api/vehicles',
    evListings: '/api/ev-listings',
    marketplace: '/api/marketplace',
    wanted: '/api/wanted',
    forums: '/api/forums',
    blog: '/api/blog',
    chargingStations: '/api/charging-stations',
    directory: '/api/directory',
    reviews: '/api/reviews',
    likes: '/api/likes',
    messages: '/api/messages',
    upload: '/api/upload',
    search: '/api/search',
    health: '/health'
  };
  
  next(error);
};

module.exports = {
  notFound
};