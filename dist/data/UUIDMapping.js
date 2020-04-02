"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UUIDMapping {
    getTagsAsText() {
        var message = "";
        for (var tag in this.tags) {
            message += tag.toString() + '=' + this.tags[tag].toString() + ', ';
        }
        if (message.length > 0) {
            message = message.substring(0, message.length - 2);
        }
        return message;
    }
    static fromObject(uuid, inputObject) {
        var mapping = new UUIDMapping();
        mapping.uuid = uuid;
        mapping.measurement = inputObject.measurement;
        mapping.tags = inputObject.tags;
        mapping.intervalSec = inputObject.intervalSec || 0;
        mapping.critical = inputObject.critical || false;
        return mapping;
    }
}
exports.UUIDMapping = UUIDMapping;
//# sourceMappingURL=UUIDMapping.js.map