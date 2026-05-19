import jwt, { SignOptions } from 'jsonwebtoken';

export function gerarAccessToken(payload: {
  id: string; papel: string; email: string;
}): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRY || '15m') as SignOptions['expiresIn'],
    issuer: 'sippe-ufsc',
    audience: 'sippe-client'
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, options);
}

export function gerarRefreshToken(usuarioId: string): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as SignOptions['expiresIn'],
    issuer: 'sippe-ufsc'
  };
  return jwt.sign(
    { id: usuarioId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET as string,
    options
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
