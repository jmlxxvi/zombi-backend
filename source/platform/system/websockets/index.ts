import config from "../../config";
import log from "../log";
import cache from "../../persistence/cache";
import session from "../session";
import { string_end } from "../utils";

import aws from "../../cloud/aws";
import { ZombiExecuteContextData } from "../../../server/types";

const cache_prefix = () => `${config.sockets.cache_prefix}:WS:`; 

const send_message_to_session = async (
    { token, subject = "none", data = [], context }: 
    { token: string, subject?: string, data?: any, context: ZombiExecuteContextData}
): Promise<boolean> => {

    const connection_id = await session.get(token, "connection_id");

    if (connection_id) {

        const connection_data = await cache.generic("HGETALL", cache_prefix() + connection_id);

        if (connection_data.token === token) {

            const { domain_name, stage } = connection_data;

            const short_token = string_end(token);
        
            log.debug(`Sending message to token: ${short_token}, connection ID: ${connection_id}, domain: ${domain_name}, stage: ${stage}`, "sockets/send_message_to_session", context);

            await aws.send_ws_message({ domain_name, stage, connection_id, message: JSON.stringify({ subject, data }) });

            return true;

        } else {

            log.debug(`Connection data not found for connection ID: ${connection_id}`, "sockets/send_message_to_session", context);

            return false;

        }

    } else {

        log.debug(`Connection ID not found for token: ${token}`, "sockets/send_message_to_session", context);

        return false;

    }

};

const send_message_to_user = async ( // TODO add option to skip one token, fox example to send broadcast to all except my own token
    { user_id, subject = "none", data = [], context }: 
    { user_id?: string, subject?: string, data?: any, context: ZombiExecuteContextData}
): Promise<boolean> => {

    const tokens = await session.tokens(user_id);

    if (tokens.length === 0) {

        log.debug(`No tokens found for user ID ${user_id}`, "sockets/send_message_to_user", context);

        return false;

    } else {

        log.debug(`${tokens.length} tokens found for user ID ${user_id}`, "sockets/send_message_to_user", context);

        const promises = [];

        for (const token of tokens) {

            const user_name = await session.get(token, "fullname");
    
            log.debug(`Sending message to ${user_name}, token: ${string_end(token)}`, "sockets/send_message_to_user", context);

            promises.push(send_message_to_session({ token, subject, data, context }));
    
        }

        await Promise.all(promises);

        return true;

    }

};

const send_broadcast_message = async (
    { subject = "none", data = [], context, who_am_i }: 
    { subject?: string, data?: any, context: ZombiExecuteContextData, who_am_i?: string}
): Promise<boolean[]> => {

    const tokens = await session.tokens();

    log.debug(`${tokens.length} tokens found`, "sockets/send_broadcast_message", context);

    const promises = [];

    for (const token of tokens) {

        if (!!who_am_i && who_am_i === token) {

            log.debug(`Not sending to the caller, token: ${string_end(who_am_i)}`, "sockets/send_broadcast_message", context);

        } else {

            const user_name = await session.get(token, "fullname");

            log.debug(`Sending message to ${user_name}, token: ${string_end(token)}`, "sockets/send_broadcast_message", context);
    
            promises.push(send_message_to_session({ token, subject, data, context }));

        }

    }

    return Promise.all(promises);

};

export {
    cache_prefix,
    send_broadcast_message,
    send_message_to_user,
    send_message_to_session
};

/*

https://www.piesocket.com/websocket-tester#

*/