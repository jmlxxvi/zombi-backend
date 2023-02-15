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

const ddbmig = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const migration_profile = "_dev";

    /*

    payments_stage
    --------------
    
    drop table payments_stage

    create table payments_stage (
        transaction_id varchar(200),
        amount varchar(200),
        client_id varchar(200),
        created_at varchar(200),
        product_id varchar(200),
        result varchar(4000),
        updated_at varchar(200),
        status varchar(200),
        phone_number varchar(200),
        externalData varchar(4000),
        state varchar(200)
    )

    create table payments (
        transaction_id varchar(100) constraint payments_pk primary key,
        amount float,
        client_id  varchar(100) not null,
        created_at timestamp not null,
        product_id varchar(30),
        result varchar(4000),
        updated_at timestamp,
        status varchar(20) ,
        phone_number varchar(20),
        externalData varchar(4000),
        state varchar(20)
    )

    */

    let ddb_data = await aws.dynamodb().scan({ TableName: "payments" + migration_profile }).promise();

    await db.sql("truncate table payments_stage", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into payments_stage (
                transaction_id,
                amount,
                client_id,
                created_at,
                product_id,
                result,
                updated_at,
                status,
                phone_number,
                externalData,
                state
            ) values (
                :transaction_id,
                :amount,
                :client_id,
                :created_at,
                :product_id,
                :result,
                :updated_at,
                :status,
                :phone_number,
                :externalData,
                :state
            )`,
            [
                item.transaction_id,
                item.amount,
                item.client_id,
                item.created_at,
                item.product_id,
                item.result,
                item.updated_at,
                item.status,
                item.phone_number,
                item.externalData,
                item.state
            ],
            "d2p"
        );

    }

    await db.sql("truncate table payments", [], "d2p");

    await db.sql(`
        insert into payments (
            transaction_id,
            amount,
            client_id,
            created_at,
            product_id,
            result,
            updated_at,
            status,
            phone_number,
            externalData,
            state
        )
        select 
            transaction_id,
            TO_NUMBER(amount,'999.999'),
            client_id,
            to_timestamp(created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
            product_id,
            result,
            case when updated_at = 'null' then null else to_timestamp(updated_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ') end "updated_at",
            status,
            phone_number,
            externalData,
            state
        from payments_stage`,
    [],
    "d2p"
    );

    let sql_count = await db.sqlv("select count(*) from payments", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

    /*

    core_transactions_stage
    -----------------------

    create table core_transactions_stage (
        transaction_id varchar(1000),
        created_at varchar(1000),
        destination varchar(1000),
        origin varchar(1000),
        status varchar(4000),
        updated_at varchar(1000),
        state varchar(4000),
        recipient varchar(4000),
        cvu varchar(4000)
    )

    create table core_transactions (
        transaction_id varchar(100) constraint core_transactions_pk primary key,
        created_at timestamp not null,
        destination varchar(100) not null,
        origin varchar(100) not null,
        status varchar(4000),
        updated_at timestamp,
        state varchar(4000),
        recipient varchar(4000),
        cvu varchar(4000)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "core_transactions" + migration_profile }).promise();

    await db.sql("truncate table core_transactions_stage", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into core_transactions_stage (
                transaction_id,
                created_at,
                destination,
                origin,
                status,
                updated_at,
                state,
                recipient,
                cvu
            ) values (
                :transaction_id,
                :created_at,
                :destination,
                :origin,
                :status,
                :updated_at,
                :state,
                :recipient,
                :cvu
            )`,
            [
                item.transaction_id,
                item.created_at,
                item.destination,
                item.origin,
                item.status,
                item.updated_at,
                item.state,
                item.recipient,
                item.cvu
            ],
            "d2p"
        );

    }

    await db.sql("truncate table core_transactions", [], "d2p");

    await db.sql(`
        insert into core_transactions (
            transaction_id,
            created_at,
            destination,
            origin,
            status,
            updated_at,
            state,
            recipient,
            cvu
        )
        select 
            transaction_id,
            to_timestamp(created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
            trim(destination),
            origin,
            status,
            case when updated_at = 'null' then null else to_timestamp(updated_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ') end,
            state,
            recipient,
            cvu
        from core_transactions_stage
        where LENGTH(destination) < 100`,
    [],
    "d2p"
    );

    sql_count = await db.sqlv("select count(*) from core_transactions", [], "d2p");

    console.log(`${sql_count} elements on postgres`);



    /*
    fintech_clients
    ---------------

    create table fintech_clients (
        client_id varchar(100) constraint fintech_clients_pk primary key,
        email varchar(200),
        google varchar(8000),
        signedTyC varchar(8000),
        cuil varchar(20),
        phone varchar(8000),
        legal varchar(8000),
        document varchar(8000),
        hash varchar(200),
        address varchar(8000),
        occupation varchar(100),
        account varchar(1000),
        creationDate timestamp,
        cvu varchar(25),
        clientStatus varchar(20)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "fintech_clients" + migration_profile }).promise();

    await db.sql("truncate table fintech_clients", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into fintech_clients (
                client_id,
                email,
                google,
                signedTyC,
                cuil,
                phone,
                legal,
                document,
                hash,
                address,
                occupation,
                account,
                creationDate,
                cvu,
                clientStatus
            ) values (
                :client_id,
                :email,
                :google,
                :signedTyC,
                :cuil,
                :phone,
                :legal,
                :document,
                :hash,
                :address,
                :occupation,
                :account,
                to_timestamp(:creationDate, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
                :cvu,
                :clientStatus
            )`,
            [
                item.client_id,
                item.email,
                JSON.stringify(item.google),
                JSON.stringify(item.signedTyC),
                item.cuil,
                JSON.stringify(item.phone),
                JSON.stringify(item.legal),
                JSON.stringify(item.document),
                item.hash,
                JSON.stringify(item.address),
                item.occupation,
                JSON.stringify(item.account),
                item.creationDate,
                item.cvu,
                item.clientStatus
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from fintech_clients", [], "d2p");

    console.log(`${sql_count} elements on postgres`);


    /* ---------------------------------------------------- */


    /*
    client_devices
    ---------------

    create table client_devices (
        client_id varchar(100) not null,
        device_token varchar(1000) not null
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "client_devices" + migration_profile }).promise();

    await db.sql("truncate table client_devices", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into client_devices (
                client_id,
                device_token
           ) values (
                :client_id,
                :device_token
           )`,
            [
                item.client_id,
                item.device_token
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from client_devices", [], "d2p");

    console.log(`${sql_count} elements on postgres`);


    /* ---------------------------------------------------- */


    /*
    onboarding_data
    ---------------

    create table onboarding_data (
        onboarding_id varchar(100),
        client_id varchar(100),
        created_at timestamp not null,
        history varchar(8000),
        ipAddress varchar(100),
        match varchar(8000),
        ocr varchar(8000),
        scanReference varchar(100),
        status varchar(100),
        counter int,
        reason varchar(8000)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "onboarding_data" + migration_profile }).promise();

    await db.sql("truncate table onboarding_data", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into onboarding_data (
                onboarding_id,
                client_id,
                created_at,
                history,
                ipAddress,
                match,
                ocr,
                scanReference,
                status,
                counter,
                reason
           ) values (
                :onboarding_id,
                :client_id,
                to_timestamp(:created_at, 'YYYY-MM-DDTHH24:MI:SS.MSZ'),
                :history,
                :ipAddress,
                :match,
                :ocr,
                :scanReference,
                :status,
                :counter,
                :reason
           )`,
            [
                item.onboarding_id,
                item.client_id,
                item.created_at,
                JSON.stringify(item.history),
                item.ipAddress,
                JSON.stringify(item.match),
                JSON.stringify(item.ocr),
                item.scanReference,
                item.status,
                item.counter ? item.counter : null,
                JSON.stringify(item.reason)
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from onboarding_data", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */


    /*
    push_notifications
    ---------------

    create table push_notifications (
        message_id varchar(100) not null,
        client_id varchar(100) not null,
        counter int not null,
        created_at timestamp not null,
        message varchar(8000),
        status varchar(100)
    )

    */

    //    ddb_data = await aws.dynamodb().scan({ TableName: "push_notifications" + migration_profile }).promise();

    //    await db.sql("truncate table push_notifications", [], "d2p");

    //    console.log(`${ddb_data.Items.length} elements on dynamo`);

    //    for (const item of ddb_data.Items) {

    //        await db.sql(
    //            `insert into push_notifications (
    //                 message_id,
    //                 client_id,
    //                 counter,
    //                 created_at,
    //                 message,
    //                 status
    //            ) values (
    //                 :message_id,
    //                 :client_id,
    //                 :counter,
    //                 :created_at,
    //                 :message,
    //                 :status
    //            )`,
    //            [
    //                 item.message_id,
    //                 item.client_id,
    //                 item.counter,
    //                 item.created_at,
    //                 item.message, // JSON.stringify(item.message),
    //                 item.status
    //            ],
    //            "d2p"
    //        );

    //    }

    //    sql_count = await db.sqlv("select count(*) from push_notifications", [], "d2p");

    //    console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */


    /*
    event_hooks
    ---------------

    create table event_hooks (
        hook_id varchar(100) not null,
        accountId varchar(100) not null,
        applicationUserId varchar(100) not null,
        description varchar(1000),
        enable varchar(10) not null,
        endpointUrl varchar(200) not null,
        events varchar(8000),
        eventsHierarchical varchar(10) not null
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "event_hooks" + migration_profile }).promise();

    await db.sql("truncate table event_hooks", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into event_hooks (
                hook_id,
                accountId,
                applicationUserId,
                description,
                enable,
                endpointUrl,
                events,
                eventsHierarchical
           ) values (
                :hook_id,
                :accountId,
                :applicationUserId,
                :description,
                :enable,
                :endpointUrl,
                :events,
                :eventsHierarchical
           )`,
            [
                item.hook_id,
                item.accountId,
                item.applicationUserId,
                item.description,
                item.enable,
                item.endpointUrl,
                JSON.stringify(item.events),
                item.eventsHierarchical
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from event_hooks", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */


    /*
    client_whitelist
    ---------------

    create table client_whitelist (
        email varchar(200) not null
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "client_whitelist" + migration_profile }).promise();

    await db.sql("truncate table client_whitelist", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into client_whitelist (
                email
           ) values (
                :email
           )`,
            [
                item.email
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from client_whitelist", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

    /* ---------------------------------------------------- */


    /*
    pin_phone_numbers
    ---------------

    create table pin_phone_numbers (
        phone_number varchar(100) not null,
        client_id  varchar(100) not null,
        expiration_date timestamp not null,
        pin varchar(20) not null
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "pin_phone_numbers" + migration_profile }).promise();

    await db.sql("truncate table pin_phone_numbers", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into pin_phone_numbers (
                phone_number,
                client_id,
                expiration_date,
                pin
           ) values (
                :phone_number,
                :client_id,
                :expiration_date,
                :pin
           )`,
            [
                item.phone_number,
                item.client_id,
                item.expiration_date,
                item.pin
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from pin_phone_numbers", [], "d2p");

    console.log(`${sql_count} elements on postgres`);


    /* ---------------------------------------------------- */


    /*
    fintech_clients_history
    ---------------

    create table fintech_clients_history (
        client_id varchar(100) not null,
        clientStatus varchar(8000),
        cuil varchar(8000),
        document varchar(8000)
    )

    */

    ddb_data = await aws.dynamodb().scan({ TableName: "fintech_clients_history" + migration_profile }).promise();

    await db.sql("truncate table fintech_clients_history", [], "d2p");

    console.log(`${ddb_data.Items.length} elements on dynamo`);

    for (const item of ddb_data.Items) {

        await db.sql(
            `insert into fintech_clients_history (
                client_id,
                clientStatus,
                cuil,
                document
           ) values (
                :client_id,
                :clientStatus,
                :cuil,
                :document
           )`,
            [
                item.client_id,
                JSON.stringify(item.clientStatus),
                JSON.stringify(item.cuil),
                JSON.stringify(item.document)
            ],
            "d2p"
        );

    }

    sql_count = await db.sqlv("select count(*) from fintech_clients_history", [], "d2p");

    console.log(`${sql_count} elements on postgres`);

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

const sendsns = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // const ddb_data = await aws.dynamodb().scan({ TableName: "client_devices" }).promise();

    // for (const item of ddb_data.Items) {

    //     console.log(item.client_id, item.device_token)

    // }


    // aws sns subscribe --topic-arn arn:aws:sns:us-east-1:382257471380:JMG-TEST-SNS-1 --protocol email --notification-endpoint jmguillen@teco.com.ar

    await aws.sns.publish("JMG-TEST-SNS-1", "this is a test message, go figure");

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const kafkapublish = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    // aws sns subscribe --topic-arn arn:aws:sns:us-east-1:382257471380:JMG-TEST-SNS-1 --protocol email --notification-endpoint jmguillen@teco.com.ar

    // await aws.sns.publish("JMG-TEST-SNS-1", "this is a test message, go figure");

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
    ddbmig,
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
