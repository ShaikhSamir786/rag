const request = require('supertest');
const app = require('../../app');

describe('Payment API Integration Tests', () => {
    const tenantId = 'test-tenant-123';
    const userId = 'test-user-123';

    describe('POST /api/payments/intent', () => {
        it('should create a payment intent', async () => {
            const response = await request(app)
                .post('/api/payments/intent')
                .set('x-tenant-id', tenantId)
                .send({
                    amount: 100,
                    currency: 'USD',
                    description: 'Test payment',
                    userId
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('clientSecret');
        });

        it('should return 400 for invalid amount', async () => {
            const response = await request(app)
                .post('/api/payments/intent')
                .set('x-tenant-id', tenantId)
                .send({
                    amount: -100,
                    currency: 'USD',
                    userId
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/payments/:id', () => {
        it('should get payment intent', async () => {
            // First create a payment intent
            const createResponse = await request(app)
                .post('/api/payments/intent')
                .set('x-tenant-id', tenantId)
                .send({
                    amount: 100,
                    currency: 'USD',
                    userId
                });

            const paymentIntentId = createResponse.body.id;

            // Then retrieve it
            const response = await request(app)
                .get(`/api/payments/${paymentIntentId}`)
                .set('x-tenant-id', tenantId);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', paymentIntentId);
        });
    });
});


