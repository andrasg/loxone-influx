"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LoxoneUpdateEvent {
    constructor(uuid, evt) {
        this.uuid = uuid;
        this.value = evt;
        this.date = new Date();
    }
    asIPoint() {
        return {
            measurement: this.mapping.measurement,
            tags: this.mapping.tags,
            fields: { value: this.value },
            timestamp: this.date.getTime()
        };
    }
}
exports.LoxoneUpdateEvent = LoxoneUpdateEvent;
//# sourceMappingURL=LoxoneUpdateEvent.js.map