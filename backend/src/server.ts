import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { aiRouter } from './routes/aiRoutes.js';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Routes
app.use('/api/ai', aiRouter);

// Base health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'HomeGen AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Only start the server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`⚡ HomeGen AI Backend server running on port ${config.port}`);
    console.log(`   Gemini Status: ${config.geminiApiKey ? 'API Key Configured' : 'Using Rule-Based Fallback'}`);
  });
}
