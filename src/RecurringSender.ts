import { RememberedValue } from "./data/RememberedValue";
import { InfluxStore } from "./InfluxStore";
import { LoxoneUpdateEvent } from "./data/LoxoneUpdateEvent";
import { Logger } from "./Logger";

class RecurringSender {
    influxStore: InfluxStore;

    constructor(influxStore:InfluxStore) {
        this.influxStore = influxStore;
    }

    rememberedValues:Map<string, RememberedValue> = new Map();

    init() {
        var that = this;
        setInterval(function() {
            for (const [uuid, rememberedValue] of that.rememberedValues) {
                if (rememberedValue.sendAfter < new Date()) {
                    Logger.log_info("--> CACHE  " + rememberedValue.event.mapping.measurement + ', ' + rememberedValue.event.mapping.getTagsAsText() + ', value=' + rememberedValue.event.value.toString());
                    rememberedValue.event.date = new Date();
                    that.influxStore.sendLoxoneUpdateEventToInflux(rememberedValue.event);
                    rememberedValue.calcNextSend();
                }
            }
        }, 60 * 1000);
    }

    set(event:LoxoneUpdateEvent) {
        this.rememberedValues.set(event.uuid, new RememberedValue(event));
    }
}

export { RecurringSender } 