class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        if (!callback) {
            delete this.events[event];
            return;
        }
        this.events[event] = this.events[event].filter(cb => cb !== callback);
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }

    once(event, callback) {
        const onceWrapper = (data) => {
            try { callback(data); } finally { this.off(event, onceWrapper); }
        };
        this.on(event, onceWrapper);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

export default EventEmitter;