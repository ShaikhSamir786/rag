import client from 'prom-client';

export class Metrics {
    static instance;

    constructor() {
        this.register = new client.Registry();

        client.collectDefaultMetrics({ register: this.register });

        this.httpRequestDuration = new client.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5]
        });

        this.httpRequestTotal = new client.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code']
        });

        this.activeConnections = new client.Gauge({
            name: 'active_connections',
            help: 'Number of active connections'
        });

        this.register.registerMetric(this.httpRequestDuration);
        this.register.registerMetric(this.httpRequestTotal);
        this.register.registerMetric(this.activeConnections);
    }

    static getInstance() {
        if (!Metrics.instance) {
            Metrics.instance = new Metrics();
        }
        return Metrics.instance;
    }

    getRegister() {
        return this.register;
    }
}
