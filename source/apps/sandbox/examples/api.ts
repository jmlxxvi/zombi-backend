// @ts-nocheck

import config from "../../../platform/config";
import db from "../../../platform/persistence/db";
// const session = require("../../../platform/session");
import cache from "../../../platform/persistence/cache";
import { send_message_to_session } from "../../../platform/system/websockets";
import { pad, sleep, uuid, b64d, b64e } from "../../../platform/system/utils";
import { loopback, queue } from "../../../platform/client";
import i18n from "../../../platform/system/i18n";
import { send as kafkasend } from "../../../platform/services/kafka";
import log from "../../../platform/system/log";
import { send_message_to_firebase_token, get_firebase_info, send_firebase_message_to_session_token } from "../../../platform/services/firebase";
// const session = require("../../../platform/session");
import { http, loopback } from "../../../platform/client";
import { send_message } from "../../../platform/services/slack";

const fs = require("fs").promises;

import aws from "../../../platform/cloud/aws";

import glob from "glob";

import type { ZombiExecuteReturnData, ZombiExecuteContextData } from "../../server/types";

import to_tree from "../../../platform/persistence/db/to_tree";

/**
 * This function just returns an error to show the default error handler
 */
export const default_error_handler = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    throw new Error("Oh my!");

};


export const ping = async (_args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: "pong"
    };

};

export const base64_decode = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: b64d(args)
    };

};

export const base64_encode = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: b64e(args)
    };

};

export const sqs_enqueue_test = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const beacon = uuid();

    await queue({
        data: {
            "token": context.token,
            "mod": "sandbox/examples",
            "fun": "sqs_enqueue_test_save",
            "args": beacon,
            "request_id": context.request_id
        }
    });

    await sleep(5000);

    const recovered_beacon = await cache.get("SQSTESTBEACON");

    return {
        error: false,
        code: 1000,
        data: recovered_beacon
    };

};

export const sqs_enqueue_test_save = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.set("SQSTESTBEACON", args);

    log.debug(`SQS Enqueue Test beacon ${data}`, "sqs_enqueue_test_save", context);

    return {
        error: false,
        code: 1000,
        data
    };

};

export const cached_function = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.fun("sandbox_examples_cached_function_test", async () => {

        await sleep(3000);

        return 999;

    }, 10);

    return {
        error: false,
        code: 1000,
        data
    };

};

export const cached_function_delete = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.del("sandbox_examples_cached_function_test");

    return {
        error: false,
        code: 1000,
        data
    };

};

export const recursive_counter = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const counter = typeof args === "undefined" ? 100 : parseInt(args) - 1;

    if (counter > 0) {

        await loopback({
            data: {
                mod: "sandbox/examples",
                fun: "recursive_counter",
                args: counter
            }
        });

    }

    return {
        error: false,
        code: 1000,
        data: counter
    };

};

export const fibonacci = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    let response;

    if (typeof args !== "number") {

        throw new Error("Qué onda?");

    }

    if (args === 0) { response = 0; }
    else if (args === 1) { response = 1; }
    else {
        const f1 = await loopback({
            data: {
                mod: "sandbox/examples",
                fun: "fibonacci",
                args: args - 1
            },
            url: config.client.endpoint
        });
        const f2 = await loopback({
            data: {
                mod: "sandbox/examples",
                fun: "fibonacci",
                args: args - 2
            },
            url: config.client.endpoint
        });

        response = f1.data + f2.data;

    }

    return {
        error: false,
        code: 1000,
        data: response
    };

};


export const kafkapublish = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const topic = args.topic ? args.topic : "jmgtopic";
    const messages = args.messages ? args.messages : "hey buddy";

    await kafkasend({
        topic,
        messages,
        request_id: context.request_id
    });

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export const delay_response = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    await sleep(args * 1000);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export const memory_no_leak = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const size = args ? args : 1000000;

    let noleak = Array(size).fill("WASTED_MEMORY");

    return {
        error: false,
        code: 1000,
        data: Intl.NumberFormat().format(noleak.length)
    };

};

let leak;

export const memory_leak = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const size = args ? args : 1000000;

    leak = Array(size).fill("WASTED_MEMORY");

    return {
        error: false,
        code: 1000,
        data: Intl.NumberFormat().format(leak.length)
    };

};

export const memory_leak_fix = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    leak = null;

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export const memory_leak_gc = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    let message = 'GC not enabled'; // node --expose_gc -r ts-node/register source/server

    if (global.gc) {
        global.gc();
        message = 'GC is enabled';
    }

    return {
        error: false,
        code: 1000,
        data: message
    };

};




export const transaction_operations = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const operations = [
        {
            query: "select country from users where username = 'test' for update",
            bind: []
        },
        {
            query: "update users set country = :country where username = 'test'",
            bind: ['XY']
        },
        {
            query: "insert into color (color_name) values ('black')",
            identity: "color_id"
        }
    ];

    const data = await db.transaction(operations, "default");

    return {
        error: false,
        code: 1000,
        data
    };

};

export const transaction_pool_client = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const db_client = await db.aquire_pool_client();

    try {

        await db_client.sql({ query: "BEGIN" });

        await db_client.sql({ // could not obtain lock on row in relation \"users\": 55P03
            query: "select country from users where username = 'test' for update nowait"
        });

        await sleep(10000);

        await db_client.sql({
            query: "update users set country = :country where username = 'test'",
            bind: ['XZ']
        });

        await db_client.sql({ query: "COMMIT" });

        return {
            error: false,
            code: 1000,
            data: null
        };

    } catch (error) {

        await db_client.sql({ query: "ROLLBACK" });

        log.error(error)

        return {
            error: true,
            code: 1100,
            data: error.message + " / " + error.code,
        };

    } finally {

        await db_client.release_pool_client();

    }

};

export const transaction_pool_client_serialized = async (args: number, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const db_client = await db.aquire_pool_client();

    try {

        await db_client.sql({ query: "BEGIN ISOLATION LEVEL SERIALIZABLE" });

        await db_client.sql({
            query: "select country from users where username = 'test'"
        });

        await sleep(10000);

        await db_client.sql({
            query: "update users set country = :country where username = 'test'",
            bind: ['XZ']
        });

        await db_client.sql({ query: "COMMIT" }); // could not serialize access due to concurrent update: 40001"

        return {
            error: false,
            code: 1000,
            data: null
        };

    } catch (error) {

        await db_client.sql({ query: "ROLLBACK" });

        log.error(error)

        return {
            error: true,
            code: 1100,
            data: error.message + " / " + error.code,
        };

    } finally {

        await db_client.release_pool_client();

    }

};

export const websockets_send_to_token = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { token, message = "This is a test message" } = args;

    await send_message_to_session({ token, context: "EXAMPLE_MESSAGE", data: message });

    return {
        error: false,
        code: 1000,
        data: token
    };

};

export const send_push_notification_to_token = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { token, payload } = args;

    const data = await send_firebase_message_to_session_token({
        token,
        payload,
        request_id: context.request_id
    });

    return {
        error: false,
        code: 1000,
        data: data
    };

};



