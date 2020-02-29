class UUIDMapping {
    uuid: string;
    measurement: string;
    tags: { [name: string]: string; };
    intervalSec: any;

    getTagsAsText(): string {
        var message = "";
        for (var tag in this.tags) {
            message += tag.toString() + '=' + this.tags[tag].toString() + ', ';
        }
        if (message.length > 0) {
            message = message.substring(0, message.length - 2);
        }
        return message;
    }

    static fromObject(uuid: string, inputObject: any): UUIDMapping {
        var mapping = new UUIDMapping();
        mapping.uuid = uuid;
        mapping.measurement = inputObject.measurement;
        mapping.tags = inputObject.tags;
        mapping.intervalSec = inputObject.intervalSec;

        return mapping;
    }
}

export { UUIDMapping } 