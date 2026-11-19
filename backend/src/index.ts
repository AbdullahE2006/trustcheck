import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = createApp(path.resolve(__dirname, '../../frontend/dist'));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`TrustCheck backend running on http://localhost:${PORT}`);
});
