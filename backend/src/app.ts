import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import scanRoutes from './routes/scan.routes.js';
import { globalErrorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';

// Best-effort in-memory rate limiter (per server instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (windowMs: number, max: number, name = 'api') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${req.ip || 'unknown'}`;
    const now = Date.now();

    if (rateLimitStore.size > 10000) rateLimitStore.clear(); // memory safety

    const record = rateLimitStore.get(key);
    if (!record || now >= record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (record.count >= max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.',
      });
    }
    record.count += 1;
    next();
  };
};

export function createApp(distPath?: string) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // No CORS headers on purpose: the site and API share one origin,
  // so other websites cannot call this API from a browser.

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', rateLimit(15 * 60 * 1000, 150));
  // Routes that make outbound network requests get a stricter limit
  app.use(['/api/v1/scans/url', '/api/v1/scans/website-security', '/api/v1/scans/email-phishing'], rateLimit(15 * 60 * 1000, 40, 'probe'));

  app.use(express.json({ limit: '50kb' }));

  app.use('/api/v1/scans', scanRoutes);

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  if (distPath && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api\/|health).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
