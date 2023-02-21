let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import config from "../../../platform/config";
import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import db from "../../../platform/persistence/db";
// import security from "../../../platform/system/security";
// import session from "../../../platform/system/session";
import { timestamp, uuid } from "../../../platform/system/utils";
import codes from "../../../platform/codes";
import { notify_errors } from "../../../platform/system/errors/notify";


import type {
    LambdaIncomingFromEventBridge,
} from "./types";
import { ZombiExecuteContextData } from "../../types";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const bootstrap_end_time = Date.now();

export const run = async (context: ZombiExecuteContextData, type: string): Promise<void> => {

    log.debug(`Executing reactor for type "${type}"`, "reactor/run", context);

    /* IMPORTANT NOTE: Anything running below should NOT bubble up exceptions. Please catch ALL exceptions inside the called module. */
    switch (type) {

        case "every10minutes":

            await Promise.all([
                // session.expire({ context })
            ]);

            break;

        case "everyHour":
            await Promise.all([
            ]);
            break;

        case "every6hours":

            break;

        case "every12hours":

            break;

        case "everyDay":
            await Promise.all([
            ]);
            break;

        default: log.error(`Invalid Reactor type specified: ${type}`, "reactor/run", context); break;

    }

};

// AWS Events scheduled to run periodically, https://console.aws.amazon.com/events
// Use  { "source": "reactor", type: "every10minutes", "token": "fvfw322gw3g3452f" } as event data
// This event should NOT retry on error so make sure to set retry attempts to zero.

export const handler = async (event: LambdaIncomingFromEventBridge): Promise<void> => {

    const request_id: string = uuid();

    const context: ZombiExecuteContextData = {
        request_id,
        executor_uuid
    };

    const event_type = event.type || "unknown";

    if (config.reactor.enabled) {

        const start_time: number = timestamp(true);

        if (!bootstrap_done) {

            bootstrap_done = true;

            log.info("Starting handler", "lambda/handler", context);

            codes.load(context);

            await cache.connect({ request_id });

            await db.connect({ request_id });

            log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", context);

            log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", context);

        }

        try {

            if (event.token === config.reactor.token) {

                log.info("Reactor invoked via Eventbridge", "lambda/handler:reactor", context);

                await run(context, event_type);

            } else {

                log.error("Invalid token", "lambda/handler:reactor", context);

            }

        } catch (error) {

            notify_errors({
                subject: `reactor > ${event_type}`,
                message: error.stack || error,
                context
            });

            log.error(error, "lambda/handler:reactor", context);

        }

    } else {

        log.info("Reactor is disabled in config", "lambda/handler:reactor", context);

    }

};
