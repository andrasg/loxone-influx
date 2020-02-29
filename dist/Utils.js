"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UUIDMapping_1 = require("./data/UUIDMapping");
class Utils {
    /**
     * Limits a string to a max of limit characters and replaces the rest with ...
     * @param text input text
     * @param limit limit to use
     */
    static limit_str(text, limit) {
        limit = typeof limit !== 'undefined' ? limit : 100;
        text = '' + text;
        if (text.length <= limit) {
            return text;
        }
        return text.substr(0, limit) + '...(' + text.length + ')';
    }
    static readUUIDMappings(config) {
        let uuids = config.get('uuids');
        var mappings = {};
        for (var uuid in uuids) {
            mappings[uuid] = UUIDMapping_1.UUIDMapping.fromObject(uuid, uuids[uuid]);
        }
        return mappings;
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map