import jwt from 'jsonwebtoken';

// Augment Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        subscription_plan: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'matchengine-super-secret-key-2026';
const JWT_EXPIRATION = '7d'; // 7 días

export function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_plan: user.subscription_plan
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  // Obtener token de header Authorization o cookie
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Token requerido.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  req.user = decoded;
  next();
}

// Middleware opcional - solo verifica si hay token pero no falla si no existe
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.cookies?.token;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}
