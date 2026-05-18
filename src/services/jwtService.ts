import jwt from 'jsonwebtoken';

export function gerarAccessToken(payload: {
  id: string; papel: string; email: string;
}): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRY ?? '15m',
    issuer: 'sippe-ufsc',
    audience: 'sippe-client'
  });
}

export function gerarRefreshToken(usuarioId: string): string {
  return jwt.sign(
    { id: usuarioId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY ?? '7d',
      issuer: 'sippe-ufsc' }
  );
}

export function verificarAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: 'sippe-ufsc',
    audience: 'sippe-client'
  });
}

export function verificarRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    issuer: 'sippe-ufsc'
  });
}
