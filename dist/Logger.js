"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    static log_error(message) {
        console.log((new Date().toISOString()) + ' ERROR : ' + message);
    }
    static log_info(message) {
        console.log((new Date().toISOString()) + ' INFO : ' + message);
    }
    static log_debug(message) {
        if (Logger.debug) {
            console.log((new Date().toISOString()) + ' DEBUG: ' + message);
        }
    }
    static setDebug(debug) {
        Logger.debug = debug;
    }
}
exports.Logger = Logger;
Logger.debug = false;
//# sourceMappingURL=Logger.js.map