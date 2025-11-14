function requireAuth(req, res, next) {
//temporary auth placeholder
    if (!req.user && !req.headers.authorization) {
      return res.status(401).json({ message: 'Not Authenticated' });
    }
    next();
  }
  
  function redirectIfLoggedIn(req, res, next) {
    if (req.user || req.headers.authorization) {
      return res.status(403).json({ message: 'Already logged in' });
    }
    next();
  }
  
  module.exports = { requireAuth, redirectIfLoggedIn };
  