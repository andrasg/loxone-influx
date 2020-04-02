"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RememberedValue_1 = require("./data/RememberedValue");
const Logger_1 = require("./Logger");
class RecurringSender {
    constructor(influxStore) {
        this.rememberedValues = new Map();
        this.influxStore = influxStore;
    }
    init() {
        var that = this;
        setInterval(function () {
            for (const [uuid, rememberedValue] of that.rememberedValues) {
                if (rememberedValue.sendAfter < new Date()) {
                    Logger_1.Logger.log_info("--> CACHE " + rememberedValue.event.mapping.measurement + ', ' + rememberedValue.event.mapping.getTagsAsText() + ', value=' + rememberedValue.event.value.toString());
                    rememberedValue.event.date = new Date();
                    that.influxStore.sendLoxoneUpdateEventToInflux(rememberedValue.event);
                    rememberedValue.calcNextSend();
                }
            }
        }, 60 * 1000);
    }
    set(event) {
        this.rememberedValues.set(event.uuid, new RememberedValue_1.RememberedValue(event));
    }
}
exports.RecurringSender = RecurringSender;
//# sourceMappingURL=RecurringSender.js.map