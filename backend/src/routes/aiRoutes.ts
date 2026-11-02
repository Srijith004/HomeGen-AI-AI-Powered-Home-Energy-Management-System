import { Router } from 'express';
import { chatWithGemini, getInsights, generateReport, healthCheck } from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.get('/health', healthCheck);
aiRouter.post('/chat', chatWithGemini);
aiRouter.post('/insights', getInsights);
aiRouter.post('/report', generateReport);
