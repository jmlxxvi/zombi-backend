import config from "../../../../platform/config";
// import app_config from "../../config";
// import log from "../../../../platform/system/log";
import security from "../../../../platform/system/security";
import { sleep } from "../../../../platform/system/utils";

import type { ZombiAPIReturnData, ZombiExecuteContextData } from "../../../../server/types";

/* ************************************************************************************************
WARNING - 警告 - ADVERTENCIA - AVERTISSEMENT - WARNUNG - AVVERTIMENTO - 警告 - 경고 - ПРЕДУПРЕЖДЕНИЕ
    This module is public as defined on config.security.public_modules
    Every exported function can be executed from the outside WITHOUT a security token.
************************************************************************************************ */

/**
 * This function is used as a health check.
 * @returns The version number
 */
export const health = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<string>> => {

    return {
        error: false,
        code: 1000,
        data: "alive"
    };

};

/**
 * This function creates a hash of the string passed as parameter.
 * This is the same hash used to create users so it would be useful for example to create a user directly on the database.
 * @param {string} args
 * @returns It returns an string similar to $2a$10$PVCCDHQvWyi62q/OMW58Du9nAvXbdsjJ5uGVP//rH4FKCbdf7HpoG
 */
export const hash = async (args: string, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<string>> => {

    await sleep(600); // To prevent password brute force attack

    return {
        error: false,
        code: 1000,
        data: await security.password_hash(args)
    };

};

export const echo = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => 
    ({ error: false, code: 1000, data: args }); 

export const timeout = async (_args: never, _context: ZombiExecuteContextData): Promise<void> => {
    await sleep((config.server.timeout * 1000) + 1000);
};

export const output_validation_error = async (_args: never, _context: ZombiExecuteContextData): Promise<any> => 
    ({ xerror: false, code: 1000, data: "pong" });

// const forgot = async (args: InputSystemPublicForgot, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

//     const { email } = args;

//     const response = await domain_user_forgot(email, context);

//     if (response.error) {

//         return {
//             error: true,
//             code: response.code!,
//             message: codes.message(response.code!),
//             data: null
//         };

//     } else {

//         return {
//             error: false,
//             code: 1000,
//             data: response.data
//         };

//     }

// };

/**
 * Resets the password for a given recovery token
 * @param {string[]} args - The recovery token and the new password
 * @returns Promise{Object} 
 */
// const reset = async (args: ZombiAPIArgsSystemPublicReset, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

//     const [token, password] = args; // eslint-disable-line

//     try {

//         const response = await domain_user_reset(token, password);

//         return {
//             error: false,
//             code: 1000,
//             data: response
//         };

//     } catch (error) {

//         return {
//             error: true,
//             code: parseInt(error.code),
//             message: codes.message(error.code),
//             data: null
//         };

//     }

// };

