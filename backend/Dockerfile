# ==============================================
# EV Community Platform - Backend Dockerfile
# ==============================================
# Multi-stage build for optimized production image

# ==============================================
# BUILD STAGE
# ==============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ==============================================
# PRODUCTION STAGE
# ==============================================
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Copy node_modules from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p logs uploads temp && \
    chown -R nodejs:nodejs logs uploads temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV LOG_LEVEL=info

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]

# ==============================================
# DEVELOPMENT STAGE
# ==============================================
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Install development dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads temp

# Set environment variables
ENV NODE_ENV=development
ENV PORT=5000
ENV LOG_LEVEL=debug

# Expose port
EXPOSE 5000

# Start with nodemon for development
CMD ["npm", "run", "dev"]

# ==============================================
# TESTING STAGE
# ==============================================
FROM development AS testing

# Set test environment
ENV NODE_ENV=test

# Run tests
CMD ["npm", "test"]

# ==============================================
# BUILD INSTRUCTIONS
# ==============================================
# Build for production:
# docker build --target production -t ev-community-backend:latest .
#
# Build for development:
# docker build --target development -t ev-community-backend:dev .
#
# Build for testing:
# docker build --target testing -t ev-community-backend:test .
#
# Run production container:
# docker run -p 5000:5000 --env-file .env ev-community-backend:latest
#
# Run development container:
# docker run -p 5000:5000 -v $(pwd):/app --env-file .env ev-community-backend:dev
#
# Run with docker-compose:
# docker-compose up
#
# ==============================================
# SECURITY CONSIDERATIONS
# ==============================================
# 1. Uses non-root user (nodejs)
# 2. Multi-stage build reduces image size
# 3. Only production dependencies in final image
# 4. Health check included
# 5. Proper signal handling with dumb-init
# 6. Minimal base image (Alpine Linux)
# 7. No sensitive data in image layers
#
# ==============================================
# OPTIMIZATION FEATURES
# ==============================================
# 1. Layer caching optimization
# 2. Minimal runtime dependencies
# 3. Clean npm cache
# 4. Proper file ownership
# 5. Health checks for container orchestration
# 6. Signal handling for graceful shutdowns
# 7. Development and production variants