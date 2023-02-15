import { defineScript } from "redis";

export default {
    set_if_higher: defineScript({
        NUMBER_OF_KEYS: 1,
        SCRIPT: `local c = tonumber(redis.call("get", KEYS[1]))
        if c then
            if tonumber(ARGV[1]) > c then
                redis.call("set", KEYS[1], ARGV[1])
                return tonumber(ARGV[1])
            else
                return c
            end
        else
            redis.call("set", KEYS[1], ARGV[1])
            return tonumber(ARGV[1])
        end`,
        transformArguments(key: string, toAdd: number): Array<string> {
            return [key, toAdd.toString()];
        },
        transformReply(reply: number): number {
            return reply;
        }
    }),
    set_if_lower: defineScript({
        NUMBER_OF_KEYS: 1,
        SCRIPT: `local c = tonumber(redis.call("get", KEYS[1]))
        if c then
            if tonumber(ARGV[1]) < c then
                redis.call("set", KEYS[1], ARGV[1])
                return tonumber(ARGV[1])
            else
                return c
            end
        else
            redis.call("set", KEYS[1], ARGV[1])
            return tonumber(ARGV[1])
        end`,
        transformArguments(key: string, toAdd: number): Array<string> {
            return [key, toAdd.toString()];
        },
        transformReply(reply: number): number {
            return reply;
        }
    })
};

/*

ZADDIFHIGHER.lua

local c = tonumber(redis.call("zscore", KEYS[1], ARGV[1]))
if c then
    if tonumber(KEYS[2]) > c then
        redis.call("zadd", KEYS[1], KEYS[2], ARGV[1])
        return tonumber(KEYS[2]) - c
    else
        return 0
    end
else
    redis.call("zadd", KEYS[1], KEYS[2], ARGV[1])
    return "OK"
end

ZADDIFLOWER.lua

local c = tonumber(redis.call("zscore", KEYS[1], ARGV[1]))
if c then
    if tonumber(KEYS[2]) < c then
        redis.call("zadd", KEYS[1], KEYS[2], ARGV[1])
        return tonumber(KEYS[2]) - c
    else
        return 0
    end
else
    redis.call("zadd", KEYS[1], KEYS[2], ARGV[1])
    return "OK"
end





*/