/**
 * authentication middleware is to verify that JWT tokens
 */

function createAuthMiddleware(authService) {
  return async function authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      const decoded = await authService.verifyToken(token);

      req.user = decoded;
      req.accessToken = token; // Store the token for RLS
      next();
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }
  };
}

module.exports = { createAuthMiddleware };
