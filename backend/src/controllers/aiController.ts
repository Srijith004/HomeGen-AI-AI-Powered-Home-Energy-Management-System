import { Request, Response } from 'express';
import { geminiService, HouseholdContext } from '../services/geminiService.js';
import { config } from '../config/index.js';

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: geminiService.isConfigured(),
    model: config.geminiModel,
  });
};

export const chatWithGemini = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
      return;
    }

    if (!context || typeof context !== 'object') {
      res.status(400).json({ error: 'Valid household context object is required.' });
      return;
    }

    // Limit message length to prevent abuse
    if (message.length > 2000) {
      res.status(400).json({ error: 'Message exceeds the maximum permitted length of 2000 characters.' });
      return;
    }

    const result = await geminiService.chat(message.trim(), context as HouseholdContext, history || []);
    res.json(result);
  } catch (error: any) {
    console.error('Error in chat controller:', error);
    res.status(500).json({
      error: 'Failed to process chat query.',
      details: error?.message || 'Internal server error',
    });
  }
};

export const getInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const { context } = req.body;
    if (!context || typeof context !== 'object') {
      res.status(400).json({ error: 'Valid household context object is required.' });
      return;
    }

    const result = await geminiService.getInsights(context as HouseholdContext);
    res.json(result);
  } catch (error: any) {
    console.error('Error in insights controller:', error);
    res.status(500).json({
      error: 'Failed to generate recommendations.',
      details: error?.message || 'Internal server error',
    });
  }
};

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { context, period = 'Monthly' } = req.body;
    if (!context || typeof context !== 'object') {
      res.status(400).json({ error: 'Valid household context object is required.' });
      return;
    }

    const result = await geminiService.generateReport(context as HouseholdContext, period);
    res.json(result);
  } catch (error: any) {
    console.error('Error in report controller:', error);
    res.status(500).json({
      error: 'Failed to generate report.',
      details: error?.message || 'Internal server error',
    });
  }
};
