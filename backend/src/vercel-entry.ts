import { createApp } from './app.js';

// Vercel serverless entry (bundled into ../api/index.js)
(module as any).exports = createApp();
