import { LoxoneUpdateEvent } from "./LoxoneUpdateEvent";

class RememberedValue {
    event: LoxoneUpdateEvent;
    sendAfter: Date;

    constructor(event: LoxoneUpdateEvent) {
        this.event = event;
        this.event.src = "old";
        this.calcNextSend();
    }

    calcNextSend() {
        this.sendAfter = new Date(new Date().getTime() + this.event.mapping.intervalSec * 1000);
    }
}

export { RememberedValue }