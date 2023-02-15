import config from "../../../../../platform/config";
import { get_lang_data } from "../../../../../platform/system/i18n";
import session from "../../../../../platform/system/session";
import { string_end } from "../../../../../platform/system/utils";
import log from "../../../../../platform/system/log";
// import codes from "../../../../../platform/codes";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../../../server/types";
import { ZombiSessionData } from "../../../../../platform/system/session/types";

/**
 * Starts an application for a given session token
 * If the user is already logged in to the application he does not need to send user/pass again but to "start" the application
 * That means reusing the saved token on the client to authenticate and loading the i18n data to the client
 * @return Start data
 */
const start = async (push_notifications_token: string, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const token = context.token;

    if (typeof push_notifications_token === "string") {
        await session.set(context.token, "push_notifications_token", push_notifications_token);
    }

    const session_data = await session.get_all(token) as ZombiSessionData;

    log.debug(`Starting application for token ${string_end(token)}`, "system/start", context);

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

// const feature_flags = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

//     const token = context.token;

//     const session_data = await session.get_all(token);

//     if (session_data) {

//         log.debug(`Obtaining feature flags for user ${session_data.email}`, "system/start:feature_flags", context);

//         return {
//             error: false,
//             code: 1000,
//             data: {
//                 home: "yes",
//                 status: "low",
//                 show_examples: "yes",
//             }
//         };

//     } else {

//         return {
//             error: true,
//             code: 1100,
//             data: "Session not found"
//         };
//     }
// };

export { start, firebase_token_set };
