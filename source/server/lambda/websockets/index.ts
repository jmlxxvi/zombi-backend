import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import session from "../../../platform/system/session";
import { string_end, uuid } from "../../../platform/system/utils";

import { cache_prefix } from "../../../platform/system/websockets";

import aws from "../../../platform/cloud/aws";

import type {
    LambdaWebsocketsEvent
} from "./types";

import { notify_errors } from "../../../platform/system/errors/notify";

import type {
    APIGatewayProxyStructuredResultV2,
    Context,
} from "aws-lambda";
import { ZombiExecuteContextData } from "../../types";

type WSSessionData = {
    "token": string,
    "domain_name": string,
    "stage": string
};

const set_session_data = async (data: WSSessionData, token: string, connection_id: string, prefix: string) => {

    await session.set(token, "connection_id", connection_id);

    await cache.generic("HSET", prefix + connection_id, data);
};

const _connect = async (
    { token, connection_id, domain_name, stage, context }:
    { token: string, connection_id: string, domain_name: string, stage: string, context: ZombiExecuteContextData }
) => {

    if (token) {

        log.debug(`Connecting from token: ${string_end(token)}, connection ID: ${connection_id}`, "websockets/_connect", context);
    
        const session_data = await session.get_all(token);
    
        if (session_data === null) {
            
            throw new Error(`Session not found for token: ${string_end(token)}, connection ID: ${connection_id} not created`);
    
        } else {
    
            const cache_data = { token, domain_name, stage };
        
            await set_session_data(cache_data, token, connection_id, cache_prefix());
    
        }

    } else {

        throw new Error("Invalid token sent to connect");
        
    }

};

const _disconnect = async ({ connection_id, context }: { connection_id: string, context: ZombiExecuteContextData }) => {

    const token = await cache.generic("HGET", cache_prefix() + connection_id, "token");

    if (token) {

        log.debug(`Disconnecting from token: ${string_end(token)}, connection ID: ${connection_id}`, "websockets/_disconnect", context);

        await session.del(token, "connection_id");


    } else {

        log.debug(`Token not found on session with connection ID ${connection_id}`, "websockets/_disconnect", context);

    }

    await cache.del(cache_prefix() + connection_id);

};

const _default = async (
    { connection_id, domain_name, stage, context, body }:
    { connection_id: string, domain_name: string, stage: string, context: ZombiExecuteContextData, body: string }
) => {

    log.debug(`Default action contains [${JSON.stringify(body)}], connection ID: ${connection_id}`, "websockets/_default", context);

    try {

        if (body.substring(0, 4) === "ping") {
            
            try {

                await aws.send_ws_message({ domain_name, stage, connection_id, message: "pong" });
                
            } catch (error) {
    
                log.error(error, "sockets/send_message_to_session", context);
                
            }

        }
        
    } catch (error) {

        try {

            await aws.send_ws_message({ domain_name, stage, connection_id, message: error.message });
            
        } catch (error) {

            log.error(error, "sockets/send_message_to_session", context);
            
        }

    }

};

const run = async (
    { token, connection_id, route_key, body, domain_name, stage, context }: 
    { token: string, connection_id: string, route_key: string, body: string, domain_name: string, stage: string, context: ZombiExecuteContextData }
): Promise<void> => {

    if (route_key === "$connect") {

        await _connect({ token, connection_id, domain_name, stage, context });

    } else if (route_key === "$disconnect") {

        await _disconnect({ connection_id, context });

    } else {

        await _default({ connection_id, domain_name, stage, body, context });

    }

};

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

export const handler = async (
    event: LambdaWebsocketsEvent,
    _context?: Context // TODO does APIGW sends context? If so, is there something useful there?
): Promise<APIGatewayProxyStructuredResultV2> => {

    const request_id = (event?.queryStringParameters?.request_id) ? event.queryStringParameters.request_id : uuid();
    const token: string = (event.queryStringParameters?.token) ? event.queryStringParameters.token : "none";

    const context: ZombiExecuteContextData = {
        token,
        request_id,
        executor_uuid
    };

    try {

        await cache.connect(request_id);

        const {
            connectionId: connection_id,
            domainName: domain_name,
            stage,
            routeKey: route_key
        } = event.requestContext;

        const body = event.body ?? "";

        log.debug(`Processing Websockets route key ${route_key}`, "lambda/server:websockets", context);

        await run({ token, connection_id, route_key, body, domain_name, stage, context });

        return {
            "statusCode": 200,
            "body": "ok"
        };

    } catch (error) {

        notify_errors({
            subject: "websockets",
            message: error.stack || error,
            context
        });

        log.error(error, "lambda/server:websockets", context);

        return {
            "statusCode": 1100,
            "body": error.message
        };

    }

};

// Notes:
//  In case of error
// "errorType": "AccessDeniedException",
// "errorMessage": "User: arn:aws:sts::382257471380:assumed-role/JMG-TEST-WS-PUBLIC-role-gtexeo7z/JMG-TEST-WS-PUBLIC is not authorized to perform: execute-api:ManageConnections on resource: arn:aws:execute-api:us-east-1:********1380:ihd9y8pe0l/dev/POST/@connections/{connectionId}",
//  It is possible to "solve" it by adding the policy AmazonAPIGatewayInvokeFullAccess to the lambda role