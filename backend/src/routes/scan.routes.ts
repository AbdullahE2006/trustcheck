import { NextFunction, Request, Response, Router } from 'express';
import {
  scanUrl,
  analyzeScamMessage,
  analyzeEmailPhishing,
  getWebsiteSecurityInfo,
  breachRange,
} from '../controllers/scan.controller.js';

const router = Router();

// Validate that a body field exists, is a string and is not too long
const requireText = (field: string, maxLength: number) =>
  (req: Request, res: Response, next: NextFunction) => {
    const value = req.body?.[field];
    if (typeof value !== 'string' || !value.trim()) {
      return res.status(400).json({ status: 'error', message: `"${field}" is required` });
    }
    if (value.length > maxLength) {
      return res.status(400).json({
        status: 'error',
        message: `"${field}" is too long (max ${maxLength} characters)`,
      });
    }
    next();
  };

router.post('/url', requireText('url', 2048), scanUrl);
router.post('/scam-message', requireText('message', 5000), analyzeScamMessage);
router.post('/email-phishing', requireText('emailContent', 20000), analyzeEmailPhishing);
router.post('/website-security', requireText('url', 2048), getWebsiteSecurityInfo);

router.get('/breach-range/:prefix', breachRange);

export default router;
