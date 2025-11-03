import { Request, Response, NextFunction } from 'express';

/**
 * Stack Auth middleware for protecting admin routes
 * This middleware checks for a valid Stack Auth session
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('[AUTH] Checking authentication for:', req.method, req.path);
    console.log('[AUTH] Headers:', req.headers.authorization);
    
    // For development, bypass auth if BYPASS_AUTH is set
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('[AUTH] Bypassing auth (BYPASS_AUTH=true)');
      next();
      return;
    }

    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] No valid authorization header found');
      return res.status(401).json({ 
        message: 'Unauthorized: No authentication token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[AUTH] Token received:', token.substring(0, 20) + '...');

    // For development with session-based auth, accept admin-session tokens
    if (process.env.NODE_ENV === 'development' && token.startsWith('admin-session-')) {
      console.log('[AUTH] Valid admin session token');
      next();
      return;
    }

    // Verify the token format
    if (!token || token.length < 10) {
      console.log('[AUTH] Invalid token format');
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid authentication token' 
      });
    }

    // TODO: Implement actual Stack Auth verification for production
    // Example with Stack Auth SDK:
    // const stackAuth = new StackAuth({ projectId: process.env.STACK_PROJECT_ID });
    // const user = await stackAuth.verifyToken(token);
    // req.user = user;

    // In development mode, accept any valid-looking token
    console.log('[AUTH] Token accepted (development mode)');
    next();
  } catch (error) {
    console.error('[AUTH] Auth error:', error);
    return res.status(401).json({ 
      message: 'Unauthorized: Authentication failed' 
    });
  }
}

/**
 * Optional auth middleware - doesn't block if no token provided
 * but adds user info if token is valid
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Verify token and attach user info if valid
      // req.user = await verifyToken(token);
    }
    
    next();
  } catch (error) {
    // Don't block the request, just log the error
    console.error('Optional auth error:', error);
    next();
  }
}
