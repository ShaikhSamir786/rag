const { WebhookService } = require('../../src/core/services/webhook.service');
const { StripeStrategy } = require('../../src/core/strategies/stripe.strategy');

// Mock dependencies
jest.mock('../../src/core/strategies/stripe.strategy');
jest.mock('../../src/core/repositories/webhook-event.repository');

describe('WebhookService', () => {
    let webhookService;

    beforeEach(() => {
        webhookService = new WebhookService();
    });

    describe('processWebhookEvent', () => {
        it('should verify webhook signature', async () => {
            const mockEvent = {
                id: 'evt_123',
                type: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: 'pi_123',
                        status: 'succeeded'
                    }
                }
            };

            StripeStrategy.prototype.verifyWebhookSignature = jest.fn().mockReturnValue(mockEvent);

            const result = await webhookService.processWebhookEvent(
                'stripe',
                JSON.stringify(mockEvent),
                'signature',
                'tenant-123'
            );

            expect(result).toHaveProperty('eventId', 'evt_123');
        });

        it('should reject invalid signature', async () => {
            StripeStrategy.prototype.verifyWebhookSignature = jest.fn().mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            await expect(
                webhookService.processWebhookEvent(
                    'stripe',
                    'payload',
                    'invalid-signature',
                    'tenant-123'
                )
            ).rejects.toThrow();
        });
    });
});

