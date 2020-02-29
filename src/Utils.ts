import { IConfig } from "config";
import { UUIDMapping } from "./data/UUIDMapping";

class Utils {
    /**
     * Limits a string to a max of limit characters and replaces the rest with ...
     * @param text input text
     * @param limit limit to use
     */
    static limit_str(text: string, limit: number){
        limit = typeof limit !== 'undefined' ? limit : 100;
        text = ''+text;
        if (text.length <= limit){
            return text;
        }
        return text.substr(0, limit) + '...('+text.length+')';
    }

    static readUUIDMappings(config: IConfig) {
        let uuids:any = config.get('uuids');
        var mappings = {};
    
        for (var uuid in uuids) {
            mappings[uuid] = UUIDMapping.fromObject(uuid, uuids[uuid]);
        }
    
        return mappings;
    }
}

export { Utils }