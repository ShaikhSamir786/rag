const Stripe = require('stripe');

class SubscriptionService {
    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    async subscribe(userId, planId) {
        // Create stripe subscription logic
        return { status: 'active', planId };
    }
}

module.exports = { SubscriptionService };
