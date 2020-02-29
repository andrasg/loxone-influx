
class Logger {

    private static debug:boolean = false;

    static log_error(message: string) {
        console.log((new Date().toISOString())+' ERROR : '+message);
    }

    static log_info(message: string) {
        console.log((new Date().toISOString())+' INFO : '+message);
    }

    static log_debug(message: string) {
        if (Logger.debug){
            console.log((new Date().toISOString())+' DEBUG: '+message);
        }
    }

    static setDebug(debug:boolean) {
        Logger.debug = debug;
    }
}

export { Logger }