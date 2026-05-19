import winston from 'winston';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development'
      ? winston.format.simple()
      : winston.format.json()
  })
];

if (process.env.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' 
    ? 'warn' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports
});
