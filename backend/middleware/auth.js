import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth middleware - token:', token ? 'present' : 'missing');
  
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  // Try both possible secrets to handle existing tokens
  const possibleSecrets = [
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    'your-secret-key',
    'secret_key'
  ];
  
  let tokenVerified = false;
  
  for (const secret of possibleSecrets) {
    try {
      const user = jwt.verify(token, secret);
      console.log('✅ Token verified with secret:', secret.substring(0, 10) + '...');
      console.log('✅ Authenticated user:', user);
      req.user = user;
      tokenVerified = true;
      break;
    } catch (err) {
      console.log(`❌ Failed with secret ${secret.substring(0, 10)}...:`, err.message);
      continue;
    }
  }
  
  if (!tokenVerified) {
    console.log('❌ Token could not be verified with any secret');
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
