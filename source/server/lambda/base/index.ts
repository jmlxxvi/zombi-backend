let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import config from "../../../platform/config";
import { execute } from "../../execute";
import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import db from "../../../platform/persistence/db";
import security from "../../../platform/system/security";
import { timestamp, uuid } from "../../../platform/system/utils";
import codes from "../../../platform/codes";

import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
    Context,
} from "aws-lambda";


import type { ZombiExecuteHTTPHeaders, ZombiExecuteContextData } from "../../types";
import stats from "../../../platform/system/stats";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const bootstrap_end_time = Date.now();

const set_headers = (response: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 => {

    if (typeof response.headers === "undefined") { response.headers = {}; }

    response.headers["Access-Control-Allow-Headers"] = config.security.cors.headers;
    response.headers["Access-Control-Allow-Origin"] = config.security.cors.origin;
    response.headers["Access-Control-Allow-Methods"] = config.security.cors.methods;

    response.headers["Content-Type"] = "application/json";

    return response;

};

export const handler = async (api_gateway_event: APIGatewayProxyEventV2, api_gateway_context?: Context): Promise<APIGatewayProxyStructuredResultV2> => {

    const start_time: number = timestamp(true);
    
    const headers = (api_gateway_event.headers as ZombiExecuteHTTPHeaders);

    const params = JSON.parse(api_gateway_event.body as string);

    const request_id: string = params.request_id ? params.request_id : uuid();

    const remote_ip = headers["x-forwarded-for"] || api_gateway_event.requestContext?.http?.sourceIp;

    const context: ZombiExecuteContextData = {
        request_id,
        remote_ip,
        executor_uuid,
    };

    log.trace(`Headers ${JSON.stringify(headers)}`, "lambda/handler", context);

    if (!bootstrap_done) {

        bootstrap_done = true;

        log.info("Starting handler", "lambda/handler", context);

        codes.load(context);

        await cache.connect(context);

        await db.connect(context);

        await stats.start({ request_id });

        await security.start(context, true);

        log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", context);

        log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", context);

    }

    const results = await execute(params, context);

    if (typeof api_gateway_context?.getRemainingTimeInMillis === "function") {

        log.debug(`Remaining lambda time: ${api_gateway_context.getRemainingTimeInMillis()}ms`, "lambda/handler", context);

    }

    return set_headers({
        statusCode: 200,
        body: JSON.stringify(results)
    });

};