import config from "../platform/config";
import log from "../platform/system/log";
import session from "../platform/system/session";
import { string_end, timestamp } from "../platform/system/utils";
import { validate_schema } from "../platform/system/utils/validators";
import security from "../platform/system/security";
import codes from "../platform/codes";
import { notify_errors } from "../platform/system/errors/notify";

import input_schema from "./schemas/input.json";
import output_schema from "./schemas/output.json";

import path from "path";

import type { ZombiExecuteData, ZombiExecuteReturnData, ZombiExecuteContextData } from "./types";

export const execute = async (
    params: Record<string, any>,
    context: ZombiExecuteContextData,
): Promise<ZombiExecuteReturnData<any>> => {

    const start_time: number = timestamp(true);

    const mod = params.mod ?? "unknown";
    const fun = params.fun ?? "unknown";

    try {

        let elapsed = -1;

        const validation = validate_schema(input_schema, params);

        if (validation.valid) {

            log.trace(`Remote IP is ${context.remote_ip}`, "lambda/handler", context);

            const { args, token } = params;

            context.token = token;
    
            let timeout_id;
    
            const results = (await Promise.race([
                verify({
                    mod,
                    fun,
                    args,
                    context
                }),
                new Promise((_, reject) => {
                    timeout_id = setTimeout(() => {
                        reject(new Error("ZombiServerTimeoutError"));
                    }, config.server.timeout);
                })
            ])) as ZombiExecuteReturnData<any>;
    
            if (timeout_id) { clearTimeout(timeout_id); }
    
            elapsed = timestamp(true) - start_time;

            results.origin = `${mod}:${fun}`;

            results.status = {
                timestamp: timestamp(true),
                elapsed: elapsed,
                request_id: context.request_id,
                executor: context.executor_uuid,
                ...results.status,
            };

            const validation = validate_schema(output_schema, results);

            if (validation.valid) {
    
                log.debug(`👍 Server executed ${results.origin} => ${results.status.code} in ${elapsed}ms`, "lambda/handler", context);
    
                return results;
    
            } else {

                const elapsed = timestamp(true) - start_time;

                const results: ZombiExecuteReturnData<null> = {
                    origin: `${mod}:${fun}`,
                    status: {
                        error: true,
                        code: 1100, // TODO use a code for failed validations
                        message: config.security.hide_server_errors ? config.security.server_error_message : `Output validation error: ${validation.message}`,
                        timestamp: timestamp(true),
                        elapsed,
                        request_id: context.request_id,
                        executor: context.executor_uuid
                    },
                    data: null
                };

                log.error(`Output validation error for ${results.origin}`, "server/run", context);

                notify_errors({
                    subject: `server > ${results.origin}`,
                    message: `Output validation error for ${results.origin}`,
                    context
                });
        
                return results;
    
            }

        } else {

            const results: ZombiExecuteReturnData<null> = {
                origin: `${mod}:${fun}`,
                status: {
                    error: true,
                    code: 1040,
                    message: config.security.hide_server_errors ? config.security.server_error_message : `Input validation error: ${validation.message}`,
                    timestamp: timestamp(true),
                    elapsed,
                    request_id: context.request_id,
                    executor: context.executor_uuid
                },
                data: null
            };
    
            return results;

        }

    } catch (error) {

        notify_errors({
            subject: `server > ${mod}:${fun}`,
            message: error.stack || error,
            context
        });

        log.error(error, "server/execute", context);

        const elapsed = timestamp(true) - start_time;

        let code = 1100;
        let message = error.message;

        if (error.message === "ZombiServerTimeoutError") {
            code = 1012;
            message = "Timeout";
        }

        const results: ZombiExecuteReturnData<null> = {
            origin: `${mod}:${fun}`,
            status: {
                error: true,
                code,
                message: config.security.hide_server_errors ? config.security.server_error_message : message,
                timestamp: timestamp(true),
                elapsed,
                request_id: context.request_id,
                executor: context.executor_uuid
            },
            data: null
        };

        return results;

    }

};

const verify = async ({ mod, fun, args, context }: any): Promise<ZombiExecuteReturnData<any>> => {

    log.debug(`⚡️ Executing ${mod}:${fun} with token ${context.token ? string_end(context.token) : "not sent"}`, "server/execute", context);

    if (config.security.log_arguments) {
        // We log this as an error because this should be enabled only on development in order to prevent the
        // security hazard it creates by showing on the logs the data the user is sending
        // TODO raise an exception when the environment is production (or non development) and config.security.log_arguments is enabled
        log.error(`Arguments: ${args ? JSON.stringify(args) : "none"}`, "server/execute", context);
    }

    if (config.security.public_modules.includes(mod)) {

        log.trace(`Module ${mod} is public`, "server/execute", context);

        return run({ mod, fun, args, context });

    } 

    if (!context.token) {

        log.debug("Token not sent", "server/execute", context);

        return {
            status: {
                error: true,
                code: 1002,
                message: codes.message(1002),
            },
            data: null,
        };
    }

    log.debug(`Using token ${string_end(context.token)}`, "server/execute", context);

    if (!await session.check(context.token)) {

        return {
            status: {
                error: true,
                code: 1001,
                message: codes.message(1001),
            },
            data: null,
        };

    } 
    
    if (!await security.authorize(mod, context)) {

        return {
            status: {
                error: true,
                code: 1014,
                message: codes.message(1014),
            },
            data: null,
        };

    } 

    await session.update(context);

    return run({ mod, fun, args, context });

};
 
const run = async ({ mod, fun, args, context }: ZombiExecuteData): Promise<ZombiExecuteReturnData<any>> => {

    const module_path = path.join(__dirname, `../apps/${mod}/api`);

    const action = await import(module_path);

    if (typeof action[fun] === "function") {

        const results = await action[fun](args, context);

        return {
            status: {
                error: results.error,
                code: results.code,
                message: results.message ?? "ok"
            },
            data: results.data,
        };

    } else {

        log.error(`[${mod}:${fun}] is not defined`, "server/run", context);

        return {
            status: {
                error: true,
                code: 1003,
                message: codes.message(1003, `${mod}:${fun}`),
            },
            data: null,
        };

    }

};


