const EventEmitter = require('events');

class EventBus {
    constructor() {
        this.emitter = new EventEmitter();
    }

    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    publish(event, data) {
        this.emitter.emit(event, data);
    }

    subscribe(event, handler) {
        this.emitter.on(event, handler);
    }

    unsubscribe(event, handler) {
        this.emitter.off(event, handler);
    }
}

module.exports = { EventBus };
