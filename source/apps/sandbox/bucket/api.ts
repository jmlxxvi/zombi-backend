// @ts-nocheck

import config from "../../../platform/config";
import db from "../../../platform/persistence/db";
// import session from "../../../platform/system/session";
import cache from "../../../platform/persistence/cache";
// const websockets = require("../../../platform/websockets");
import { pad, sleep, uuid } from "../../../platform/system/utils";
import { loopback, queue, http } from "../../../platform/client";
// import i18n from "../../../platform/system/i18n";
import { send as kafkasend } from "../../../services/kafka";
import log from "../../../platform/system/log";
import { send_message_to_firebase_token, get_firebase_info } from "../../../services/firebase";
// const session = require("../../../platform/session");
import { send_message } from "../../../services/slack";

const fs = require("fs").promises;

import aws from "../../../platform/cloud/aws";

import glob from "glob";
import path from "path";

import type { ZombiExecuteReturnData, ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

import to_tree from "../../../platform/persistence/db/to_tree";

export const ohno = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const base_path = path.normalize(__dirname + "../../../../apps");

    const files = glob.sync(base_path + "/**/api*", { nodir: false });

    console.log(files);

    const modules = files
        .filter((file: string) => (!file.includes(".map") && !file.includes(".test.")))
        .map((file: string) => {
            const file_parts = file.replace(base_path, "").split("/");
            return `${file_parts[1]}/${file_parts[2]}`
        });

    return {
        error: false,
        code: 1000,
        // data: new Set(modules)
        data: [...new Set(modules)]
    };

};

export const db001 = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const l = await cache.set2('xxxx', 'yeah');

    return {
        error: false,
        code: 1000,
        data: l
    };

    // try {

    //     await db.sql("begin");

    //     await db.sql(`select * from usersx where username = 'test' for update nowait`);
    //     const data = await db.sql(`update users set country = 'XX' where username = 'test'`);

    //     if (args === "continue") {

    //         await loopback({
    //             data: {
    //                 mod: "sandbox/bucket",
    //                 fun: "db001"
    //             }

    //         });

    //     }


    //     await db.sql("commit");

    //     return {
    //         error: false,
    //         code: 1000,
    //         data
    //     };


    // } catch (error) {

    //     console.log(`error`, error);

    //     await db.sql("rollback");

    //     return {
    //         error: true,
    //         code: 500,
    //         message: error.code,
    //         data: error.message
    //     };

    // }



};

const send_slack_message = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await send_message(context.request_id, args);

    return {
        error: data !== "ok",
        code: 1000,
        data
    };

};


const ms = async (_args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await db.sql("select * from t1", [], "ms");

    // await db.sql("select 199");

    // const email = "natalia.daniela.rapesta@gmail.com";

    // const count = await db.count({
    //     table: "fintech_clients",
    //     where: { email }
    // });

    return {
        error: false,
        code: 1000,
        data
    };

};

const ms2 = async (_args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // const sql = `CREATE TABLE t1 (uniqueIdCol uniqueidentifier, intCol int, nVarCharCol nvarchar(50))`;

    // const data = await db.sql(sql, [], "ms");

    const data = await db.count({
        table: "t1",
        where: {
            intCol: 1
        },
        db_name: "ms"
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const ms3 = async (_args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const sql = "insert into t1 (intCol, nVarCharCol) values (:a, :b)";

    const data = await db.sql(sql, [1998, "hola mundo"], "ms");

    return {
        error: false,
        code: 1000,
        data
    };

};

const ping = async (_args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // await db.sql("create sequence zombi_seq");

    // await db.sql("select 199");

    // const email = "natalia.daniela.rapesta@gmail.com";

    // const count = await db.count({
    //     table: "fintech_clients",
    //     where: { email }
    // });

    return {
        error: false,
        code: 1000,
        data: "pong"
    };

};

const b64d = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // create a buffer
    const buff = Buffer.from(args, "base64");

    // decode buffer as UTF-8
    const data = buff.toString("utf-8");

    // print normal string
    console.log(data);

    return {
        error: false,
        code: 1000,
        data
    };

};

const b64e = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // create a buffer
    const buff = Buffer.from(args, "base64");

    // decode buffer as UTF-8
    const data = buff.toString("utf-8");

    // print normal string
    console.log(data);

    return {
        error: false,
        code: 1000,
        data
    };

};




const websockets_notification_test = async (args: [number, number, string], context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    /*
        insert into public.client_whitelist values ('jcmigliavacca@gmail.com')

        SELECT fc.client_id, fc.email, cd.device_token
        FROM public.client_devices cd 
        join public.fintech_clients fc 
        on cd.client_id = fc.client_id
        where fc.email like '%luis%' 

        {"title":"Bienvenido a Fintecch","body":"Ahora podes pagar, ahorrar y manejar tu dinero mucho mas simple","data":{"payload":"{\"category\":\"IDENTITY_SUCCESS\"}"}}

        {
            "mod": "sandbox/bucket",
            "fun": "firebase_notification_test",
            "token": "683A2C3ABAAF92BDCB013CDA1B03885B2EA0751E6118A19103A25537417064F8F89972D38E4F5B369ECB2B05BF718107521DFC306A751022EEE3B458B6570DA9",
            "args": {
                "token": "emAXmM0GTPSLMynVcbZVVw:APA91bGBdiuAJnqWi_NpSZFHwEUZnFh-8J10DGqdQogaLAHteO5f_1JNwwfoHm_l9edmq6h7pMFvbJHmu0bzqNvMtaInUGegc2oZ0CBp2sntuuJY2xEzxNEchIFqooWB5dkDS6LeoJ9M",
                "payload": {
                    "data": {
                    },
                    "notification": {
                        "android": {
                        },
                        "body": "Aqui",
                        "title": "Mensaje"
                    }
                }
            }
        }

    */

    const data = await send_message_to_firebase_token({
        firebase_token: args.token,
        payload: args.payload,
        request_id: context.request_id
    });

    return {
        error: false,
        code: 1000,
        data: data
    };

};

const firebase_notification_test = async (args: [number, number, string], context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    /*
        insert into public.client_whitelist values ('jcmigliavacca@gmail.com')

        SELECT fc.client_id, fc.email, cd.device_token
        FROM public.client_devices cd 
        join public.fintech_clients fc 
        on cd.client_id = fc.client_id
        where fc.email like '%luis%' 

        {"title":"Bienvenido a Fintecch","body":"Ahora podes pagar, ahorrar y manejar tu dinero mucho mas simple","data":{"payload":"{\"category\":\"IDENTITY_SUCCESS\"}"}}

        {
            "mod": "sandbox/bucket",
            "fun": "firebase_notification_test",
            "token": "683A2C3ABAAF92BDCB013CDA1B03885B2EA0751E6118A19103A25537417064F8F89972D38E4F5B369ECB2B05BF718107521DFC306A751022EEE3B458B6570DA9",
            "args": {
                "token": "emAXmM0GTPSLMynVcbZVVw:APA91bGBdiuAJnqWi_NpSZFHwEUZnFh-8J10DGqdQogaLAHteO5f_1JNwwfoHm_l9edmq6h7pMFvbJHmu0bzqNvMtaInUGegc2oZ0CBp2sntuuJY2xEzxNEchIFqooWB5dkDS6LeoJ9M",
                "payload": {
                    "data": {
                    },
                    "notification": {
                        "android": {
                        },
                        "body": "Aqui",
                        "title": "Mensaje"
                    }
                }
            }
        }

    */

    const data = await send_message_to_firebase_token({
        firebase_token: args.token,
        payload: args.payload,
        request_id: context.request_id
    });

    return {
        error: false,
        code: 1000,
        data: data
    };

};

const test = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {


    // const data = await db.sql({
    //     query: "insert into t values (:a, :b), (:c, :d)",
    //     bind: [222, 'jiij', 200, 'jojjo']
    // });

    const data = await db.sql({
        query: "delete from t where a in (:a, :b, :c)",
        bind: [199, 111, 200]
    });

    console.log(data);

    return {
        error: false,
        code: 1000,
        data: data
    };

};

const sqstezt = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const beacon = uuid();

    await queue({
        data: {
            "token": context.token,
            "mod": "sandbox/bucket",
            "fun": "sqstezt2",
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

const sqstezt2 = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.set("SQSTESTBEACON", args);

    log.debug(`sqstezt2 beacon ${data}`, "sqstezt2", context);

    return {
        error: false,
        code: 1000,
        data
    };

};

const wssend = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const token = args;

    // await websockets.send_message_to_session({ token, context: "SESSIONS_SEND_MESSAGE", data: "This is a message for you" });

    return {
        error: false,
        code: 1000,
        data: token
    };

};




const error = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // const token = args;

    // await websockets.send_message_to_session({ token, context: "SESSIONS_SEND_MESSAGE", data: "This is a message for you" });

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const cached_function = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.fun("cached_function_test", async () => {

        await sleep(3000);

        return 999;

    }, 10);

    return {
        error: false,
        code: 1000,
        data
    };

};

const cached_function_delete = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await cache.del("cached_function_test");

    return {
        error: false,
        code: 1000,
        data
    };

};

const recursive_function = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const counter = typeof args === "undefined" ? 100 : parseInt(args) - 1;

    if (counter > 0) {

        await loopback({
            data: {
                token: context.token,
                mod: "sandbox/bucket",
                fun: "recursive_function",
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

const fibonacci = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    let response;

    if (typeof args === "undefined") {

        throw new Error("Qué onda?");

    }

    if (args === 0) { response = 0; }
    else if (args === 1) { response = 1; }
    else {
        const f1 = await loopback({
            data: {
                mod: "sandbox/bucket",
                fun: "fibonacci",
                args: args - 1
            },
            url: config.client.endpoint
        });
        const f2 = await loopback({
            data: {
                mod: "sandbox/bucket",
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

const database_function_create = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const sql = `CREATE TABLE hernan_aws (
        pk int GENERATED ALWAYS AS IDENTITY,
        username text NOT NULL,
        gecos text,
        email text NOT NULL,
        PRIMARY KEY( pk )
    )`;

    await db.sql(sql);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const database_function_drop = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const sql = "DROP TABLE hernan_aws";

    await db.sql(sql);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const database_function_insert = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const sql = "insert into hernan_aws (username, gecos, email) values (:username, :gecos, :email)";

    await db.sql(sql, ["pepe", "unknown", "pepe@mail.com"]);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const database_function_select = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const sql = "select * from hernan_aws";

    const data = await db.sql(sql);

    return {
        error: false,
        code: 1000,
        data
    };

};

const kafkapublish = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {


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


const dbtest = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // const users = "test";

    // const data = await db.sql({
    //     query: "select * from users where username = :user and enabled = :enabled", 
    //     bind: [users, "N"]
    // });

    try {

        const data = await db.sqlv({
            query: "selectx * from users where 1=2",
            bind: []
        });

        return {
            error: false,
            code: 1000,
            data
        };

    } catch (error) {

        return {
            error: true,
            code: 1000,
            data: null
        };
    }

};


const wfile = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    await fs.writeFile(`${config.storage.path}/file1.txt`, context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const rfile = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await fs.readFile(`${config.storage.path}/file1.txt`);

    return {
        error: false,
        code: 1000,
        data: data.toString()
    };

};

const afile = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const reply = await cache.generic("INCR", "afile_counter");

    await fs.appendFile(`${config.storage.path}/file1.txt`, `${reply} ${context.request_id}\n`);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const cfile = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const file = await fs.readFile(`${config.storage.path}/file1.txt`);

    const afile = file.toString().split("\n");

    console.log(afile);

    return {
        error: false,
        code: 1000,
        data: afile.length
    };

};

const ufile = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    await fs.unlink(`${config.storage.path}/file1.txt`);

    return {
        error: false,
        code: 1000,
        data: null
    };


};

const dfile = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const files = glob.sync(`${config.storage.path}/*`);

    return {
        error: false,
        code: 1000,
        data: files
    };


};

const timeout = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    await sleep(21 * 1000);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const sqlerr = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    try {

        await db.sql("select * from wefwfe where 1 = :a and 2 = :b", [1, 2]);

        return {
            error: false,
            code: 1000,
            data: null
        };


    } catch (e) {

        console.log(e);

        throw e;

        // return {
        //     error: true,
        //     code: 1000,
        //     data: e
        // }

        // console.log(e);

    }




};

// const reset_auth_cache = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

//     await security.reload_cache();

//     return {
//         error: false,
//         code: 1000,
//         data: null
//     };

// };

const trx = async (args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    try {

        /* 
            set: key val
            get: key
            del: key
            hmset key {}
            hset: key field val
            hget: key field
            hgetall: key
        */

        // const data = await cache.set("ZZZ", 1900);

        const data = await cache.get("ZZ2");

        return {
            error: false,
            code: 1000,
            data
        };

    } catch (e) {

        console.log(e);

        return {
            error: true,
            code: 1000,
            data: e.message
        };

    }




};

export {
    ping,
    b64e,
    b64d,
    firebase_notification_test,
    test,
    sqstezt,
    sqstezt2,
    wssend,
    error,
    cached_function,
    cached_function_delete,
    recursive_function,
    fibonacci,
    database_function_create,
    database_function_drop,
    database_function_insert,
    database_function_select,
    sendsns,
    timeout,
    wfile,
    rfile,
    dbtest,
    afile,
    dfile,
    cfile,
    ufile,
    kafkapublish,
    sqlerr,
    trx,
    ms,
    ms2,
    ms3,
    send_slack_message,
};
