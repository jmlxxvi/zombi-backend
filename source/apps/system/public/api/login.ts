import config from "../../../../platform/config";
import log from "../../../../platform/system/log";
import { language_exists, get_lang_data } from "../../../../platform/system/i18n";
import { validate_schema } from "../../../../platform/system/utils/validators";
import session from "../../../../platform/system/session";
import security from "../../../../platform/system/security";
import codes from "../../../../platform/codes";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../../server/types";

import { db_user_data } from "../db";

import login_input_schema from "./schemas/login.input.json";
import type { InputSystemPublicLogin } from "./schemas/login.input";

import type { OutputSystemPublicLogin } from "./schemas/login.output";

/* ************************************************************************************************
WARNING - 警告 - ADVERTENCIA - AVERTISSEMENT - WARNUNG - AVVERTIMENTO - 警告 - 경고 - ПРЕДУПРЕЖДЕНИЕ
    This module is public as defined on config.security.public_modules
    Every exported function can be executed from the outside WITHOUT a security token.
************************************************************************************************ */

/**
 * This function is used to login to the application.
 * 
 * It is important for the client to save the token returned and use it to authenticate on subsequent requests.
 * 
 * @param args 
 * @param args.username 
 * @param args.password 
 * @param args.language
 * @param args.push_notifications_token
 * 
 * @returns Login data
 * 
 * @example
 * Arguments:
 * { username: "mary", password: "PaSsw0rd", language: "es" }
 * { username: "mary", password: "PaSsw0rd", language: "es", push_notifications_token: "dssd345sdve4534twfwz" }
 * 
 * @example
 * Returned Data:
 * {"data": "token": "WEFWEF3463WEFWEF5445YWVW", { "i18n": {}, "fullname": "SYSTEM", "timezone": "America/Argentina/Buenos_Aires", "email": "none@mail.com", "country": "AR" }}
 */
export const login = async (args: InputSystemPublicLogin, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<OutputSystemPublicLogin | null>> => {

    const validation = validate_schema(login_input_schema, args);

    if (validation.valid) {

        const { username, password, language = config.i18n.default_language, push_notifications_token = "none" } = args;

        if (!language_exists(language)) {

            return {
                error: true,
                code: 1005,
                message: `Invalid language: ${language}`,
                data: null
            };

        } else {

            const user_data = await db_user_data({
                field: "lower(username)",
                value: username.toLowerCase()
            });

            if (user_data !== null) {

                const { id: user_id, email, password: hashpass, fullname } = user_data;
                const timezone = (user_data?.timezone) ? user_data.timezone : config.i18n.default_timezone;
                const country = (user_data?.country) ? user_data.country : config.i18n.default_country;

                const password_match = await security.password_compare(password, hashpass);

                if (password_match) {

                    const token = session.token();

                    await session.create({ token, data: { user_id, language, timezone, fullname, email, country }, push_notifications_token, context });

                    return { error: false, code: 1000, data: { fullname, email, token, timezone, i18n: get_lang_data(language) } };

                } else {

                    log.debug(`User [${username}] cannot login`, "system/public:login", context);

                    return { error: true, code: 1004, message: codes.message(1004), data: null };

                }

            } else {

                log.debug(`User [${username}] not found`, "system/public:login", context);

                return { error: true, code: 1004, message: codes.message(1004), data: null };

            }

        }

    } else {

        log.error("Invalid input schema", "system/public:login", context);

        return { error: true, code: 1040, message: codes.message(1040), data: null };

    }

};

/**
 * Logoff from the application.
 * This function destroys the session so the token can't be used anymore.
 * There are no arguments passed to this function, only the token is used.
 * 
 * @returns There is no returned data from this function
 * 
 */
export const logoff = async (_args: never, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<null>> => {

    const token = context.token;

    if (token && await session.check(token)) {

        await session.destroy({ token, request_id: context.request_id });

        return {
            error: false,
            code: 1000,
            data: null
        };

    } else {

        return {
            error: true,
            code: 1002,
            message: codes.message(1002),
            data: null
        };

    }

};


// // export const forgot = async (email: string, request_id: string): Promise<ZombiDomainSystemPublicReturnForgot> => {

// validate_schema({
//     type: "object",
//     additionalProperties: false,
//     properties: {
//         username: { type: "string", minLength: 1, maxLength: 128 },
//         password: { type: "string", minLength: 1, maxLength: 128 },
//         language: { type: "string", minLength: 2, maxLength: 2 },
//         push_notifications_token: { type: "string", minLength: 128, maxLength: 164 }
//     },
//     required: ["username", "password"]
// }, args);

// //     const user_data = await infra_user_data({
// //         field: "lower(email)",
// //         value: email.toLowerCase()
// //     });

// //     if (user_data === null) {

// //         return {
// //             error: true,
// //             code: 1010
// //         };

// //     } else {

// //         const token = session.token();

// //         await db.update({
// //             table: "users",
// //             values: {
// //                 password_recovery_token: token,
// //                 password_recovery_ts: timestamp() + (config.security.pasword_recovery_token_life * 60)
// //             },
// //             where: {
// //                 "lower(email)": email.toLowerCase(),
// //                 enabled: "Y"
// //             }

// //         });

// //         const mail_contents = mail_template(
// //             "Password Recovery",
// //             `Hello,<strong> ${user_data.fullname}!</strong> Please use the button below to reset your password.`,
// //             "Recover",
// //             config.security.notifications.email.url + "?recovery=" + token
// //         );

// //         const mail_sent = await core_mail_send({
// //             from: "zombidevelopment@gmail.com",
// //             to: email,
// //             subject: "Password Recovery",
// //             body: mail_contents
// //         });

// //         log.debug(`Mail was sent ${mail_sent ? "successfuly :)" : "unsuccessfully :("}`, "system/public:forgot", context);

// //         return {
// //             error: true,
// //             data: token
// //         };

// //     }

// // };

// // export const reset = async (token: string, password: string): Promise<void> => {

// //     const user_data = await infra_user_data({
// //         field: "password_recovery_token",
// //         value: token
// //     });

// //     if (user_data === null) {

// //         throw new Error(1010);

// //     } else if ((user_data.password_recovery_ts || 0) < timestamp()) {

// //         throw new Error(1011);

// //     } else {

// //         await db.update({
// //             table: "users",
// //             values: {
// //                 password: await security.password_hash(password)
// //             },
// //             where: {
// //                 password_recovery_token: token
// //             }
// //         });

// //     }

// // };
