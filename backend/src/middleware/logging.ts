import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Request logger middleware
const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const userId = req.user ? req.user.id : 'Anonymous';

  // Log request start
  const requestLog = {
    timestamp,
    method,
    url,
    ip,
    userAgent,
    userId,
    type: 'REQUEST_START'
  };

  // Override res.end to capture response details
  const originalEnd = res.end;
  (res as any).end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length') || 0;

    // Log response
    const responseLog = {
      timestamp: new Date().toISOString(),
      method,
      url,
      ip,
      userAgent,
      userId,
      statusCode,
      duration,
      contentLength,
      type: 'REQUEST_END'
    };

    // Write to log file in development
    if (process.env.NODE_ENV === 'development') {
      const logEntry = `${responseLog.timestamp} - ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}\n`;
      const logFile = path.join(logsDir, `access-${new Date().toISOString().split('T')[0]}.log`);
      
      fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
          console.error('Error writing to log file:', err);
        }
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor = statusCode >= 400 ? '\x1b[31m' : statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      const resetColor = '\x1b[0m';
      console.log(`${statusColor}${method} ${url} - ${statusCode} - ${duration}ms${resetColor}`);
    }

    // Call original end
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

// Error logger middleware
const errorLogger = (err: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const userId = req.user ? req.user.id : 'Anonymous';
  const userAgent = req.get('User-Agent') || 'Unknown';

  const errorLog = {
    timestamp,
    method,
    url,
    ip,
    userAgent,
    userId,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    type: 'ERROR'
  };

  // Write error to log file
  const logEntry = `${timestamp} - ERROR - ${method} ${url} - ${err.message} - ${ip}\n${err.stack}\n\n`;
  const errorLogFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFile(errorLogFile, logEntry, (appendErr) => {
    if (appendErr) {
      console.error('Error writing to error log file:', appendErr);
    }
  });

  // Log to console
  console.error(`\x1b[31mERROR - ${method} ${url}:\x1b[0m`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  next(err);
};

// Security event logger
const securityLogger = (event: string, req: AuthenticatedRequest, details: Record<string, any> = {}): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const userId = req.user ? req.user.id : 'Anonymous';
  const userAgent = req.get('User-Agent') || 'Unknown';

  const securityLog = {
    timestamp,
    event,
    method,
    url,
    ip,
    userAgent,
    userId,
    details,
    type: 'SECURITY'
  };

  // Write security event to log file
  const logEntry = `${timestamp} - SECURITY - ${event} - ${method} ${url} - ${ip} - ${JSON.stringify(details)}\n`;
  const securityLogFile = path.join(logsDir, `security-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFile(securityLogFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to security log file:', err);
    }
  });

  // Log to console
  console.warn(`\x1b[33mSECURITY - ${event} - ${method} ${url} - ${ip}\x1b[0m`);
};

// Admin action logger
const adminLogger = (action: string, req: AuthenticatedRequest, targetResource: Record<string, any> = {}): void => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const adminId = req.user ? req.user.id : 'Unknown';
  const adminUsername = req.user ? (req.user as any).username || req.user.email || 'Unknown' : 'Unknown';

  const adminLog = {
    timestamp,
    action,
    adminId,
    adminUsername,
    method,
    url,
    ip,
    targetResource,
    type: 'ADMIN_ACTION'
  };

  // Write admin action to log file
  const logEntry = `${timestamp} - ADMIN - ${action} - ${adminUsername} (${adminId}) - ${method} ${url} - ${JSON.stringify(targetResource)}\n`;
  const adminLogFile = path.join(logsDir, `admin-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFile(adminLogFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to admin log file:', err);
    }
  });

  // Log to console
  console.log(`\x1b[36mADMIN - ${action} - ${adminUsername} - ${method} ${url}\x1b[0m`);
};

// Performance logger
const performanceLogger = (req: Request, res: Response, duration: number): void => {
  // Log slow requests (> 1 second)
  if (duration > 1000) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    const perfLog = {
      timestamp,
      method,
      url,
      ip,
      duration,
      type: 'SLOW_REQUEST'
    };

    // Write performance log
    const logEntry = `${timestamp} - SLOW REQUEST - ${method} ${url} - ${duration}ms - ${ip}\n`;
    const perfLogFile = path.join(logsDir, `performance-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(perfLogFile, logEntry, (err) => {
      if (err) {
        console.error('Error writing to performance log file:', err);
      }
    });

    console.warn(`\x1b[33mSLOW REQUEST - ${method} ${url} - ${duration}ms\x1b[0m`);
  }
};

// Log cleanup function (remove old log files)
const cleanupLogs = (): void => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  const now = Date.now();

  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error('Error reading logs directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          console.error('Error getting file stats:', statErr);
          return;
        }

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting old log file:', unlinkErr);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
};

// Run log cleanup daily
setInterval(cleanupLogs, 24 * 60 * 60 * 1000);

export {
  requestLogger,
  errorLogger,
  securityLogger,
  adminLogger,
  performanceLogger,
  cleanupLogs
};

export default requestLogger;