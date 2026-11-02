import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('HomeGen AI Backend API Tests', () => {
  it('GET /api/health should return service health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('HomeGen AI');
  });

  it('GET /api/ai/health should return AI status', async () => {
    const res = await request(app).get('/api/ai/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.geminiConfigured).toBe('boolean');
  });

  it('POST /api/ai/chat should reject empty message', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: '', context: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/ai/chat should provide fallback response when no Gemini key is set', async () => {
    const mockContext = {
      householdName: 'Academic 3BHK Demo',
      householdProfile: {
        bedrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        bathrooms: 2,
        diningAreas: 1,
        utilityAreas: 1,
      },
      totalCurrentPowerDemandKW: 2.45,
      totalEnergyKWh: 320.5,
      estimatedMonthlyBillINR: 1850,
      activeAppliancesCount: 8,
      appliances: [
        {
          id: 'ac-1',
          name: 'Air Conditioner (Master)',
          room: 'Bedroom 1',
          category: 'Cooling',
          ratedPowerW: 1500,
          operatingPowerW: 1200,
          dailyKWh: 7.2,
          monthlyCostINR: 864,
          status: 'ON',
        },
      ],
      topConsumingAppliances: [
        { name: 'Air Conditioner (Master)', dailyKWh: 7.2, percentage: 48.5 },
      ],
    };

    const res = await request(app)
      .post('/api/ai/chat')
      .send({
        message: 'Which appliance consumes the most electricity?',
        context: mockContext,
      });

    expect(res.status).toBe(200);
    expect(res.body.response).toBeDefined();
    expect(res.body.response).toContain('Air Conditioner (Master)');
  });

  it('POST /api/ai/insights should generate recommendations', async () => {
    const mockContext = {
      householdName: 'Academic 3BHK Demo',
      householdProfile: {
        bedrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        bathrooms: 2,
        diningAreas: 1,
        utilityAreas: 1,
      },
      totalCurrentPowerDemandKW: 2.1,
      totalEnergyKWh: 290.0,
      estimatedMonthlyBillINR: 1650,
      activeAppliancesCount: 6,
      appliances: [
        {
          id: 'ac-1',
          name: 'Air Conditioner (Master)',
          room: 'Bedroom 1',
          category: 'Cooling',
          ratedPowerW: 1500,
          operatingPowerW: 1200,
          dailyKWh: 7.2,
          monthlyCostINR: 864,
          status: 'ON',
        },
        {
          id: 'geyser-1',
          name: 'Water Heater',
          room: 'Bathroom 1',
          category: 'Water Systems',
          ratedPowerW: 2000,
          operatingPowerW: 2000,
          dailyKWh: 3.0,
          monthlyCostINR: 360,
          status: 'OFF',
        },
      ],
      topConsumingAppliances: [
        { name: 'Air Conditioner (Master)', dailyKWh: 7.2, percentage: 55 },
      ],
    };

    const res = await request(app)
      .post('/api/ai/insights')
      .send({ context: mockContext });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.recommendations[0].title).toBeDefined();
    expect(res.body.recommendations[0].priority).toBeDefined();
  });

  it('POST /api/ai/report should return audit report structure', async () => {
    const mockContext = {
      householdName: 'Academic 3BHK Demo',
      householdProfile: {
        bedrooms: 3,
        livingRooms: 1,
        kitchens: 1,
        bathrooms: 2,
        diningAreas: 1,
        utilityAreas: 1,
      },
      totalCurrentPowerDemandKW: 1.8,
      totalEnergyKWh: 240,
      estimatedMonthlyBillINR: 1250,
      activeAppliancesCount: 5,
      appliances: [],
      topConsumingAppliances: [],
    };

    const res = await request(app)
      .post('/api/ai/report')
      .send({ context: mockContext, period: 'March 2026' });

    expect(res.status).toBe(200);
    expect(res.body.executiveSummary).toBeDefined();
    expect(Array.isArray(res.body.keyObservations)).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });
});
