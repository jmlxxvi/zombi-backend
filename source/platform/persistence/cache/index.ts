import { URL } from "url";

import config from "../../config";
import log from "../../system/log";

import { createClient } from "redis";

import scripts from "./scripts";
import { ZombiExecuteContextData } from "../../../server/types";

const url = config.cache.uri;

const url_parts = new URL(url);

const redis = createClient({
    url,
    scripts
});

let connected = false;

/**
 * Connects to the Redis server defined in configuration
 * Check source/platform/config.ts
 */
const connect = async (context: ZombiExecuteContextData): Promise<void> => {

    if (!connected) {

        redis.on("error", async (error) => {
            connected = false;
            log.error("Redis error: " + error, "cache/connect", context);
        });

        redis.on("connect", async () => {
            connected = true;
            log.info("Connected to Redis server at " + url_parts.hostname + ":" + url_parts.port, "cache/connect", context);
        });

        try {

            return redis.connect();

        } catch (error) {

            connected = false;

            log.error(error, "cache/connect");

        }

    }

};

/**
 * Executes the redis function passed as the first parameter of the array
 * The remaining array elements are passes as arguments to the Redis function
 */
const generic = async (...args: any[]): Promise<any> => {

    const operation = args.shift();

    if (connected) {
        try {

            return (redis as any)[operation](...args);

        } catch (error) {

            log.error(error, "cache/generic");

            return false;

        }

    } else {
        log.error(`Calling cache function (generic: ${operation}(${JSON.stringify(args)})) when the client is closed`, "cache/connect");

        return false;
    }
};

/**
 * Returns the keys that match with the beggining of the argument of this function
 * @param pattern - The (partial) key of the Redis keys namespace
 * @returns The Redis keys matching the (partial) key
 */
const keys = async (pattern: string): Promise<string[]> => {
    if (connected) {
        const keys = [];
        for await (const scan_key of redis.scanIterator({
            MATCH: pattern + "*",
            COUNT: config.cache.fetch_size
        })) { keys.push(scan_key); }
        return keys;
    } else {
        log.error("Calling cache function (keys) when the client is closed", "cache/connect");
        return [];
    }
};

/**
 * Sets the value of a Redis key
 * @param key - The Redis key to set
 * @param value - The Redis value to set
 * @param ttl - The (optional) time to live of the entry. 0 disables the TTL
 */
const set = (key: string, value: string, ttl = 0): Promise<string | null> => {
    if (connected) {
        return redis.set(key, value, {
            EX: ttl
        });
    } else {
        log.error("Calling cache function (set) when the client is closed", "cache/connect");
        return Promise.resolve(null);
    }
};

/**
 * Gets the value of a Redis key
 */
const get = (key: string): Promise<string | null> => {
    if (connected) {
        return redis.get(key);
    } else {
        log.error("Calling cache function (get) when the client is closed", "cache/connect");
        return Promise.resolve(null);
    }
};

/**
 * Deletes a Redis key
 */
const del = (key: string): Promise<number> => {
    if (connected) {
        return redis.del(key);
    } else {
        log.error("Calling cache function (del) when the client is closed", "cache/connect");
        return Promise.resolve(0);
    }
};

/**
 * Checks if the given Redis key exists
 */
const exists = (key: string): Promise<number> => {
    if (connected) {
        return redis.exists(key);
    } else {
        log.error("Calling cache function (exists) when the client is closed", "cache/connect");
        return Promise.resolve(-1);
    }
};

/**
 * Returns true if the server is connected
 */
const is_connected = () => connected;

/**
 * Disconnects from Redis
 */
const disconnect = async () => {
    if (connected) {
        connected = false;
        await redis.disconnect();
    }
    log.info("Disconnected from cache", "cache/disconnect");
};

/**
 * Executed the funtion passed as parameter and saves the results on the Redis key given
 * It is used as a caching mechanism for functions
 * @param key - The Redis key to save the results of the function
 * @param fn - The function to execute
 * @param ttl - The TTL of the created key
 */
const fun = async (key: string, fn: () => Promise<any>, ttl = 0) => {
    if (connected) {
        const cached = await get(key);
        if (cached) {
            return cached;
        } else {
            const value = await fn();
            await set(key, value, ttl);
            return value;
        }
    } else {
        log.error("Calling cache function (fun) when the client is closed", "cache/connect");
        return false;
    }
};

const set_if_higher = async (key: string, value: number): Promise<number> => {

    return redis.set_if_higher(key, value);

};

const set_if_lower = async (key: string, value: number): Promise<number> => {

    return redis.set_if_lower(key, value);

};

const increment_by = (key: string, value = 1): Promise<number> => {
    if (connected) {
        return redis.INCRBY(key, value);
    } else {
        log.error("Calling cache function (increment_by) when the client is closed", "cache/connect");
        return Promise.resolve(-1);
    }
};

const flush_db = (): Promise<string> => {
    if (connected) {
        return redis.FLUSHALL();
    } else {
        log.error("Calling cache function (flush_db) when the client is closed", "cache/connect");
        return Promise.resolve("ERR");
    }
};

export default {
    connect,
    set,
    get,
    del,
    exists,
    generic,
    keys,
    disconnect,
    set_if_higher,
    set_if_lower,
    fun,
    is_connected,
    increment_by,
    flush_db,
};
