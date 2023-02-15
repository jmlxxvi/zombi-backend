import config from "../../config";
import { string_end, timestamp, random_hexa_chars } from "../utils";
import log from "../log";
import cache from "../../persistence/cache";
import { ts2date } from "../i18n/time";
import { ZombiExecuteContextData } from "../../../server/types";
import { ZombiSessionData } from "./types";

const cache_prefix = (): string => `${config.session.cache_prefix}:`;

const check = async (token: string): Promise<boolean> => {

    const data = await get_all(token);

    return (data !== null && "user_id" in data);

};

const update = async (context: ZombiExecuteContextData): Promise<number> => {

    if (context.token) {
        
        const ts = timestamp();
        
        await cache.generic("HSET", cache_prefix() + context.token, "updated", ts);

        return ts;

    } else {

        log.debug("Empty token", "session/update", context);

        return 0;
    }
    
};

const create = async (
    {
        token,
        data, 
        context, 
        push_notifications_token 
    }: { 
        token: string,
        data: ZombiSessionData,
        context: ZombiExecuteContextData, 
        push_notifications_token?: string
    }
): Promise<number> => {

    if (token) {

        const ts = timestamp();

        const session_data = {
            ...data, 
            created: ts,
            updated: ts
        };

        if (push_notifications_token) {
            session_data.push_notifications_token = push_notifications_token;
        }

        // await cache.generic("HSET", cache_prefix() + token, session_data);
        await multi_set(token, session_data);

        log.debug(`Session created for token ${string_end(token)}`, "session/create", context);

        return ts;

    } else {

        log.error("Cannot create session, empty token", "session/create", context); 

        throw new Error("Cannot create session with an invalid token");

    }

};

const destroy = async (context : ZombiExecuteContextData): Promise<string | undefined> => {

    const cache_key = cache_prefix() + context.token;

    log.debug(`Deleting cache key ${cache_key}`, "sessions/destroy", context);

    await cache.del(cache_key);

    return context.token;

};

const expire = async (
    { 
        period = null, 
        context 
    }: { 
        period?: number | null, 
        context: ZombiExecuteContextData 
    }
) => {

    const ts: number = timestamp();

    const limit = ts - (period === null ? config.session.expire : period);

    log.debug(`Session limit for expiration is ${limit}, ${new Date(limit)}`, "session/expire", context);

    const keys = await cache.keys(cache_prefix());

    log.debug(`Evaluating ${keys.length} session keys`, "session/expire", context);

    for (const key of keys) {

        const parts = key.split(":");

        const token = parts[1];

        const updated = await cache.generic("HGET", key, "updated");

        log.debug(`Session for key ${string_end(token)} was updated on ${ts2date({timestamp: parseInt(updated)})}, ${ts - updated} seconds ago`, "session/expire", context);

        if (!!updated && (parseInt(updated) <= limit)) {

            log.debug(`Expired session token ${string_end(token)} inactive since  ${ts2date({timestamp: parseInt(updated)})}, exceeding limit of ${config.session.expire} seconds`, "session/expire", context);

            await destroy(context);

        }

    }

};

const get = async (token: string | undefined, key: string): Promise<string | null> => {
    if (token) {
        return cache.generic("HGET", cache_prefix() + token, key);
    } else {
        return null;
    }
};

const get_all = async (token: string | undefined): Promise<Record<string, any> | null> => {
    if (token) {
        return cache.generic("HGETALL", cache_prefix() + token);
    } else {
        return null;
    }
};

const set = async (token: string | undefined, key: string, value: string) => {
    if (token) {
        return cache.generic("HSET", cache_prefix() + token, key, value);
    } else {
        return null;
    }
};

const del = async (token: string | undefined, key: string) => {
    if (token) {
        return cache.generic("HDEL", cache_prefix() + token, key);
    } else {
        return null;
    }
};

const multi_set = async (token: string | undefined, session_data: Record<string, any>) => {
    if (token) {
        return cache.generic("HSET", cache_prefix() + token, session_data);
    } else {
        return null;
    }
};

const token = (): string => random_hexa_chars(config.security.token_size);

const tokens = async (user_id: string | null = null): Promise<string[]> => {

    const tokens: string[] = [];

    const keys = await cache.keys(cache_prefix() + "*");

    for (const key of keys) {

        const key_data = await cache.generic("HGETALL", key);

        if (key_data.user_id === user_id || user_id === null) { tokens.push(key.split(":")[1]); }
    }

    return tokens;
};

const user_id = async (token: string | undefined): Promise<string | null> => get(token, "user_id");

export default {
    cache_prefix,
    destroy,
    set,
    multi_set,
    get,
    get_all,
    del,
    check,
    token,
    create,
    expire,
    update,
    tokens,
    user_id
};
