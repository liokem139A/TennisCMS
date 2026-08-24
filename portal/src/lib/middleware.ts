import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

// Extend Next.js request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      token?: string;
    }
  }
}

// Type for the request with user
export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
  token?: string;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }

      const user = verifyToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = user;
      req.token = token;

      return handler(req, res);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to verify role-based access
 */
export function withRole(...allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void) => {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handler(req, res);
    });
  };
}

/**
 * Middleware to log API requests
 */
export function withLogging(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const method = req.method;
    const path = req.url;

    // Log response
    const originalJson = res.json;
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      console.log(`[${method}] ${path} - ${res.statusCode} (${duration}ms)`);
      return originalJson.call(this, data);
    };

    return handler(req, res);
  };
}

/**
 * Middleware to handle CORS
 */
export function withCORS(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.NEXT_PUBLIC_API_URL,
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin || '')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return handler(req, res);
  };
}

/**
 * Middleware to validate request method
 */
export function withMethod(...allowedMethods: string[]) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!req.method || !allowedMethods.includes(req.method)) {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
      }
      return handler(req, res);
    };
  };
}

/**
 * Middleware composition helper
 */
export function compose(...middlewares: any[]) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) => {
    return middlewares.reduce((acc, middleware) => middleware(acc), handler);
  };
}

export default {
  withAuth,
  withRole,
  withLogging,
  withCORS,
  withMethod,
  compose,
};
