import { UUIDMapping } from "./UUIDMapping";
import { IPoint } from "influx";
import { StringDecoder } from "string_decoder";

class LoxoneUpdateEvent {

    uuid: string;
    value: number;
    mapping: UUIDMapping;
    date: Date;
    src: string;

    constructor(uuid:string, evt: number) {
        this.uuid = uuid;
        this.value = evt;
        this.date = new Date();
    }

    asIPoint() : IPoint {
        let point:IPoint = {
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

export { LoxoneUpdateEvent }