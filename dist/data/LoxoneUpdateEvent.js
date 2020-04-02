"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LoxoneUpdateEvent {
    constructor(uuid, evt) {
        this.uuid = uuid;
        this.value = evt;
        this.date = new Date();
    }
    asIPoint() {
        let point = {
            measurement: this.mapping.measurement,
            tags: JSON.parse(JSON.stringify(this.mapping.tags)),
            fields: { value: this.value },
            timestamp: this.date.getTime()
        };
        if (this.src) {
            point.tags["src"] = this.src;
        }
        return point;
    }
}
exports.LoxoneUpdateEvent = LoxoneUpdateEvent;
//# sourceMappingURL=LoxoneUpdateEvent.js.map