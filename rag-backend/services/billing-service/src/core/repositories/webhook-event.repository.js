const { BaseRepository } = require('@rag-platform/database');
const { WebhookEvent } = require('../../domain/models/webhook-event.model');

class WebhookEventRepository extends BaseRepository {
    constructor() {
        super(WebhookEvent);
    }

    /**
     * Find webhook event by event ID
     */
    async findByEventId(eventId, provider, tenantId) {
        return this.model.findOne({
            where: { eventId, provider, tenantId }
        });
    }

    /**
     * Find unprocessed webhook events
     */
    async findUnprocessed(tenantId, options = {}) {
        return this.model.findAll({
            where: { processed: false, tenantId },
            order: [['created_at', 'ASC']],
            limit: options.limit || 100,
            ...options
        });
    }

    /**
     * Find webhook events by type
     */
    async findByEventType(eventType, tenantId, options = {}) {
        return this.model.findAll({
            where: { eventType, tenantId },
            order: [['created_at', 'DESC']],
            ...options
        });
    }

    /**
     * Mark webhook event as processed
     */
    async markAsProcessed(eventId, provider, tenantId, error = null) {
        const event = await this.findByEventId(eventId, provider, tenantId);
        if (!event) {
            return null;
        }
        return event.update({
            processed: true,
            processedAt: new Date(),
            processingError: error
        });
    }

    /**
     * Check if webhook event already exists
     */
    async exists(eventId, provider, tenantId) {
        const count = await this.model.count({
            where: { eventId, provider, tenantId }
        });
        return count > 0;
    }
}

module.exports = { WebhookEventRepository };



