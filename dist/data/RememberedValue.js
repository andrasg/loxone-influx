"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RememberedValue {
    constructor(event) {
        this.event = event;
        this.event.src = "old";
        this.calcNextSend();
    }
    calcNextSend() {
        this.sendAfter = new Date(new Date().getTime() + this.event.mapping.intervalSec * 1000);
    }
}
exports.RememberedValue = RememberedValue;
//# sourceMappingURL=RememberedValue.js.map