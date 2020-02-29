import { UUIDMapping } from "./UUIDMapping";
import { IPoint } from "influx";

class LoxoneUpdateEvent {

    uuid: string;
    value: number;
    mapping: UUIDMapping;
    date: Date;

    constructor(uuid:string, evt: number) {
        this.uuid = uuid;
        this.value = evt;
        this.date = new Date();
    }

    asIPoint() : IPoint {
        return {
            measurement: this.mapping.measurement,
            tags: this.mapping.tags,
            fields: { value: this.value },
            timestamp: this.date.getTime()
        }
    }
}

export { LoxoneUpdateEvent }