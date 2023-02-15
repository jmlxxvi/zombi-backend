import config from "../../../platform/config";
// import app_config from "../config";
import session from "../../../platform/system/session";
import log from "../../../platform/system/log";
// import codes from "../../../platform/codes";
// import { sleep, validate_schema, string_end, timestamp } from "../../../platform/system/utils";
import { timestamp } from "../../../platform/system/utils";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

import type {
    ZombiAPIArgsMobilePublicMobileErrors
} from "./types";

import { OAuth2Client } from "google-auth-library";
import db from "../../../platform/persistence/db";

/* ************************************************************************************************
WARNING - 警告 - ADVERTENCIA - AVERTISSEMENT - WARNUNG - AVVERTIMENTO - 警告 - 경고 - ПРЕДУПРЕЖДЕНИЕ
    This module is public as defined on config.security.public_modules
    Every exported function can be executed from the outside WITHOUT a security token.
************************************************************************************************ */


const mobile_errors = async (args: ZombiAPIArgsMobilePublicMobileErrors, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { error, stack_trace, device_info } = args;

    /* 
    create table mobile_errors(
        id bigint GENERATED ALWAYS AS identity,
        message varchar(1024) not null,
        stack text,
        device_info json,
        created_ts bigint not null
    )

    select 
        id, 
        message, 
        device_info -> 'androidId' as device_id, 
        device_info -> 'version' -> 'sdkInt' as device_sdk 
    from mobile_errors
    */

    await db.insert({
        table: "mobile_errors",
        values: {
            message: error,
            stack: stack_trace,
            device_info: device_info,
            created_ts: timestamp()
        }
    });

    log.error(error, "system/public", context);
    log.error(stack_trace, "system/public", context);
    log.error(JSON.stringify(device_info), "system/public", context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const validate_google_id_token = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const token = args;
    
    // eslint-disable-line

    try {

        const client_id = process.env.ZOMBI_FIREBASE_AUTH_CLIENT_ID;

        if(client_id) {

            const client = new OAuth2Client(client_id);

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: [client_id!],  // Specify the CLIENT_ID of the app that accesses the backend
                // Or, if multiple clients access the backend:
                //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
            });
            const payload = ticket.getPayload();
    
    
            /* 
            Example Payload
            {
                iss: 'https://accounts.google.com',
                azp: '859183217737-if0g2l61u1fauekke3rfqfqpmar9e6ve.apps.googleusercontent.com',
                aud: '859183217737-a4vvo0ne9633lqd0emol5arua0r52ttd.apps.googleusercontent.com',
                sub: '114248403722376753079',
                email: 'juanmartinguillen@gmail.com',
                email_verified: true,
                name: 'Juan Martin Guillen',
                picture: 'https://lh3.googleusercontent.com/a/AATXAJxc7b_1IGa4wcE0F2s1dPrz5R6QZ7M5ZsdBFj2V=s96-c',
                given_name: 'Juan Martin',
                family_name: 'Guillen',
                locale: 'en',
                iat: 1644783278,
                exp: 1644786878
            }
            */
            
            if(payload?.name && payload?.email) {
    
                const user_count = await db.count({
                    table: "users",
                    where: {
                        "email": payload.email
                    }
                });
    
                const user_id = db.uuid();
                const language = config.i18n.default_language;
                const country =  config.i18n.default_country;
                const timezone = config.i18n.default_timezone;
    
                const username = payload.email;
                const fullname = payload.name;
                const email = payload.email;
    
                if(user_count === 0) {
    
                    await db.insert({
                        table: "users",
                        values: {
                            id: user_id,
                            username,
                            fullname,
                            email,
                            language,
                            country,
                            timezone,
                            enabled:  "Y",
                            created_by: config.security.system_user_id,
                            created_ts: timestamp(),
                            password: "user_authenticated_with_google"
                        }
                    });
    
                }
    
                const token = session.token();
    
                await session.create({ token, data: { user_id, language, timezone, fullname, email, country }, push_notifications_token: "", context });
    
                return {
                    error: false,
                    code: 1000,
                    data: token
                };
    
            } else {
    
                log.info("Verification failed", "system/public:validate_google_id_token", context);
    
                return {
                    error: true,
                    code: 1100,
                    data: "Verification failed",
                };
    
            }

        } else {

            log.error("Invalid environment value for ZOMBI_FIREBASE_AUTH_CLIENT_ID", "system/public:validate_google_id_token", context);
    
            return {
                error: true,
                code: 1100,
                data: "Invalid environment value for ZOMBI_FIREBASE_AUTH_CLIENT_ID",
            };

        }

    } catch (error) {

        log.error(error, "system/public:validate_google_id_token", context);

        return {
            error: true,
            code: 1100,
            data: error.message,
        };

    }

};

const user_events = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    /* 
        -- public.mobile_events definition

        -- Drop table

        -- DROP TABLE public.mobile_events;

        CREATE TABLE public.mobile_events (
            id int8 NOT NULL GENERATED ALWAYS AS IDENTITY,
            event_type varchar(64) NOT NULL,
            payload text NULL,
            device_id varchar(1024) NOT NULL,
            created_ts int8 NOT NULL
        );

        {
            id: 'ef3d405321fc1e9f',
            timestamp: 1646924514211,
            type: 'route',
            payload: 'home'
        }
    */

    const data = args;

    for (const event of data) {

        log.debug(`Pocessing event ${event.type}:${event.payload} for device: ${event.id}`, "mobile/public:user_events");
        
        await db.insert({
            table: "mobile_events",
            values: {
                event_type: event.type,
                payload: event.payload,
                device_id: event.id,
                created_ts: timestamp(true)
            }
        });
    }

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export {
    validate_google_id_token,
    mobile_errors,
    user_events
};
