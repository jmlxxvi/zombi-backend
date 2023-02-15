import config from "../../config";
import log from "../log";

import { notify_errors } from "../errors/notify";

import { memoryUsage, version } from "process";
import { type, release, totalmem } from "os";
import { getHeapStatistics } from "v8";

import { setInterval } from "timers";
import { ZombiExecuteContextData } from "../../../server/types";

let running_memory: number;
let heap_size_limit: number;

// TODO This function does more that just checking memory usage so a name change may be needed
const check_memory_used = async (): Promise<void> => {

    if (config.stats.enabled) {

        try {
            
            const { rss, heapTotal } = memoryUsage();
    
            const running_memory_in_mb = running_memory / 1024 / 1024;
    
            const limit_rss_usage = Math.round(rss * 100 / running_memory);
            const limit_heap_usage = Math.round(heapTotal * 100 / heap_size_limit);
    
            log.info(`Memory used [MB] RSS: ${Math.round(rss / 1024 / 1024 * 100) / 100} of ${Math.round(running_memory / 1024 / 1024 * 100) / 100} (${limit_rss_usage}%)`, "stats/check_memory_used");
            log.info(`Memory used [MB] HEAP: ${Math.round(heapTotal / 1024 / 1024 * 100) / 100} of ${Math.round(heap_size_limit / 1024 / 1024 * 100) / 100} (${limit_heap_usage}%)`, "stats/check_memory_used");
    
            const max_memory_alarm_pct = parseInt(process.env.ZOMBI_SERVER_MAX_MEMORY_ALARM || "80");
    
            if (limit_rss_usage > max_memory_alarm_pct || limit_heap_usage > max_memory_alarm_pct) {
    
                const message = `Memory usage exceeded threshold (${max_memory_alarm_pct}% rss/heap ${limit_rss_usage}%/${limit_heap_usage}%)`;
    
                log.error(message, "stats/check_memory_used");
    
                notify_errors({
                    subject: `stats > ${running_memory_in_mb}`,
                    message
                });
    
            }
    
        } catch (error) { log.error (error, "stats/check_memory_used"); }

    }

};

const start = async (context: ZombiExecuteContextData): Promise<void> => {

    if (config.stats.enabled) {

        log.info(`Running Node ${version} on ${type()} ${release()}`, "stats/start", context);

        running_memory = totalmem();

        log.info(`Memory available ${Math.round(running_memory / 1024 / 1024 * 100) / 100} MB`, "stats/start", context);

        heap_size_limit = getHeapStatistics().heap_size_limit;

        log.info(`Memory heap size limit ${Math.round(heap_size_limit / 1024 / 1024 * 100) / 100} MB`, "stats/start", context);

        setInterval(check_memory_used, config.stats.memory_check_interval * 1000);

    } else { log.trace("Stats disabled on config", "stats/start", context); }

};


export default {
    start,
};