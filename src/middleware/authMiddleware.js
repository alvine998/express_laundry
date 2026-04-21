const { verifyToken } = require('../utils/authUtils');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);

      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role']
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

const basicAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [email, password] = credentials.split(':');

  if (!email || !password) {
    return res.status(401).json({ error: 'Invalid authentication credentials' });
  }

  if(email !== process.env.BASIC_AUTH_EMAIL) {
    return res.status(401).json({ error: 'Invalid email' });
  }

  if(password !== process.env.BASIC_AUTH_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'role']
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.auth = { email, password };
    next();
  } catch (error) {
    console.error('Basic auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

const verifyRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Access Denied: Requires ' + role + ' role' });
  }
  next();
};

module.exports = { authenticate, verifyRole, basicAuth };
