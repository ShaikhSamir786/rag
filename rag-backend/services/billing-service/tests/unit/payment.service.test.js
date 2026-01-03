const { PaymentService } = require('../../src/core/services/payment.service');
const { OrderService } = require('../../src/core/services/order.service');
const { StripeStrategy } = require('../../src/core/strategies/stripe.strategy');

// Mock dependencies
jest.mock('../../src/core/strategies/stripe.strategy');
jest.mock('../../src/core/services/order.service');
jest.mock('../../src/core/repositories/payment-intent.repository');
jest.mock('../../src/core/repositories/transaction.repository');

describe('PaymentService', () => {
    let paymentService;

    beforeEach(() => {
        paymentService = new PaymentService();
    });

    describe('createPaymentIntent', () => {
        it('should create a payment intent successfully', async () => {
            const mockData = {
                tenantId: 'tenant-123',
                userId: 'user-123',
                amount: 100,
                currency: 'USD'
            };

            // Mock order creation
            OrderService.prototype.createOrder = jest.fn().mockResolvedValue({
                id: 'order-123',
                orderNumber: 'ORD-123',
                amount: 100,
                currency: 'USD'
            });

            // Mock Stripe payment intent creation
            StripeStrategy.prototype.createPaymentIntent = jest.fn().mockResolvedValue({
                id: 'pi_123',
                clientSecret: 'pi_123_secret',
                status: 'requires_payment_method',
                amount: 100,
                currency: 'USD'
            });

            const result = await paymentService.createPaymentIntent(mockData);

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('clientSecret');
            expect(result.amount).toBe(100);
        });

        it('should throw error for invalid amount', async () => {
            const mockData = {
                tenantId: 'tenant-123',
                userId: 'user-123',
                amount: -100,
                currency: 'USD'
            };

            await expect(paymentService.createPaymentIntent(mockData)).rejects.toThrow();
        });
    });
});


