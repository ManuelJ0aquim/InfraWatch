import { FastifyInstance } from 'fastify';
import fastify from 'fastify';
import slaRoutes from '../src/SLA_TRACKING/api/routes';

// Mock do Prisma para os testes
jest.mock('../src/SLA_TRACKING/utils/prisma', () => ({
  getPrisma: jest.fn(() => ({
    slaPolicy: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    maintenanceWindow: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    slaWindow: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    violation: {
      findMany: jest.fn(),
    },
  }))
}));

describe('SLA API Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    await app.register(slaRoutes);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/services/:id/sla/status', () => {
    it('should return 400 if period is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/test-id/sla/status'
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: "Query param 'period' must be YYYY-MM"
      });
    });

    it('should return 400 if period format is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/services/test-id/sla/status?period=invalid'
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: "Query param 'period' must be YYYY-MM"
      });
    });

    it('should return 404 if no active policy found', async () => {
      const { getPrisma } = require('../src/SLA_TRACKING/utils/prisma');
      const mockPrisma = getPrisma();
      mockPrisma.slaPolicy.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/services/test-id/sla/status?period=2025-08'
      });
      
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        error: "No active SLA policy for service"
      });
    });
  });

  describe('POST /api/sla/policies', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/sla/policies',
        payload: {
          serviceId: 'test-id'
          // Missing required fields
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toContain('is required');
    });

    it('should create policy with valid data', async () => {
      const { getPrisma } = require('../src/SLA_TRACKING/utils/prisma');
      const mockPrisma = getPrisma();
      const mockPolicy = {
        id: 'test-policy-id',
        serviceId: 'test-service-id',
        targetPct: 99.9,
        period: 'MONTH',
        timezone: 'Africa/Luanda'
      };
      mockPrisma.slaPolicy.create.mockResolvedValue(mockPolicy);

      const response = await app.inject({
        method: 'POST',
        url: '/api/sla/policies',
        payload: {
          serviceId: 'test-service-id',
          targetPct: 99.9,
          period: 'MONTH',
          timezone: 'Africa/Luanda'
        }
      });
      
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockPolicy);
    });
  });

  describe('POST /api/services/:id/sla/incidents', () => {
    it('should return 400 if startedAt is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/services/test-id/sla/incidents',
        payload: {
          endedAt: '2025-08-14T12:00:00Z'
        }
      });
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: 'startedAt and endedAt required'
      });
    });

    it('should create incident with valid data', async () => {
      const { getPrisma } = require('../src/SLA_TRACKING/utils/prisma');
      const mockPrisma = getPrisma();
      const mockIncident = {
        id: 'test-incident-id',
        serviceId: 'test-service-id',
        startedAt: '2025-08-14T10:00:00Z',
        endedAt: '2025-08-14T12:00:00Z',
        isPlanned: false,
        source: 'manual'
      };
      mockPrisma.incident.create.mockResolvedValue(mockIncident);

      const response = await app.inject({
        method: 'POST',
        url: '/api/services/test-service-id/sla/incidents',
        payload: {
          startedAt: '2025-08-14T10:00:00Z',
          endedAt: '2025-08-14T12:00:00Z',
          isPlanned: false
        }
      });
      
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockIncident);
    });
  });
});
