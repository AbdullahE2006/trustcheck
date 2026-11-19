import { NextFunction, Request, Response } from 'express';

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('ERROR:', err?.message || err);

  // Malformed JSON, body too large etc. are client errors
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ status: 'error', message: 'Request too large' });
  }

  // Never leak internal error details
  res.status(500).json({ status: 'error', message: 'Something went wrong' });
};
