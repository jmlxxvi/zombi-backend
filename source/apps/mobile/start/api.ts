import config from "../../../platform/config";
import { get_lang_data } from "../../../platform/system/i18n";
import session from "../../../platform/system/session";
import { string_end } from "../../../platform/system/utils";
import log from "../../../platform/system/log";
import codes from "../../../platform/codes";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

/**
 * Starts an application for a given session token
 * If the user is already logged in to the application he does not need to send user/pass again but to "start" the application
 * That means reusing the saved token on the client to authenticate and loading the i18n data to the client
 * @return Start data
 */
const start = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const push_notifications_token = args;

    if(push_notifications_token) {
        await session.set(context.token, "push_notifications_token", push_notifications_token);
    }

    const user_id = await session.user_id(context.token);

    if (user_id !== null) {

        log.debug(`Starting application for token ${string_end(context.token)}`, "system/start", context);

        const session_data = await session.get_all(context.token);

        if (session_data) {

            const {
                language,
                fullname,
                timezone,
                country,
                email
            } = session_data;
        
            return {
                error: false,
                code: 1000,
                data: { i18n: get_lang_data(language ? language : config.i18n.default_language), fullname, timezone, email, country } 
            };

        } else {

            return {
                error: true,
                code: 1100,
                data: "Session data not found"
            };

        }

    } else {

        return {
            error: true,
            code: 1001,
            data: codes.message(1001),
        };

    }

};

/**
 * Set the Firebase token on the user session
 * @param args - The notifications token
 * @param context 
 * @param context.token - The session token
 */
const firebase_token_set = async (args: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const push_notifications_token = args;

    const reply = await session.set(context.token, "push_notifications_token", push_notifications_token);

    return {
        error: false,
        code: 1000,
        data: reply
    };

};

const feature_flags = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const token = context.token;

    const session_data = await session.get_all(token);

    if (session_data) {

        log.debug(`Obtaining feature flags for user ${session_data.email}`, "system/start:feature_flags", context);

        return {
            error: false,
            code: 1000,
            data: {
                home: "yes",
                status: "low",
                show_examples: "yes",
            }
        };

    } else {

        return {
            error: true,
            code: 1100,
            data: "Session data not found"
        };
    }
};


export { start, firebase_token_set, feature_flags };
