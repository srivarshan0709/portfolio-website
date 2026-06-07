import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import contactRouter from './routes/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(rootDir));
app.use('/api/contact', contactRouter);

app.get('/health', (request, response) => {
  response.json({ ok: true, service: 'portfolio-backend' });
});

app.use((request, response) => {
  response.status(404).json({
    ok: false,
    message: 'Route not found',
    path: request.originalUrl,
  });
});

app.listen(port, () => {
  console.log(`Portfolio server running on http://localhost:${port}`);
});
