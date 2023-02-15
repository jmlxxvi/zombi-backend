import config from "../../../../../platform/config";
import app_config from "../../../config";
import codes from "../../../../../platform/codes";
import i18n_countries from "../../../../../platform/system/i18n/countries.json";
import i18n_languages from "../../../../../platform/system/i18n/languages.json";
import session from "../../../../../platform/system/session";
import db from "../../../../../platform/persistence/db";

import security from "../../../../../platform/system/security";

import type { ZombiExecuteContextData, ZombiAPIReturnData, ZombiExecuteReturnSchema } from "../../../../../server/types";
import log from "../../../../../platform/system/log";
import { timestamp, uuid } from "../../../../../platform/system/utils";
import { validate_schema } from "../../../../../platform/system/utils/validators";

import users_list_input_schema from "./schemas/users_list.input.json";
import type { InputSystemAuthUsersList } from "./schemas/users_list.input";
import type { OutputSystemAuthUsersList } from "./schemas/users_list.output";
import type { DBSystemAuthUsersList } from "./types";

import user_by_id_input_schema from "./schemas/user_by_id.input.json";
import type { InputSystemAuthUserById } from "./schemas/user_by_id.input";
import type { OutputSystemAuthUserById } from "./schemas/user_by_id.output";

import user_create_input_schema from "./schemas/user_create.input.json";
import type { InputSystemAuthUserCreate } from "./schemas/user_create.input";

import user_delete_input_schema from "./schemas/user_delete.input.json";
import type { InputSystemAuthUserDelete } from "./schemas/user_delete.input";

import user_edit_input_schema from "./schemas/user_edit.input.json";
import type { InputSystemAuthUserEdit } from "./schemas/user_edit.input";
import { InputSystemAuthUserToggle } from "./schemas/user_toggle.input";

const users_list = async (args: InputSystemAuthUsersList, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<ZombiExecuteReturnSchema | OutputSystemAuthUsersList>> => {

    const validation = validate_schema(users_list_input_schema, args);

    console.log(args);

    if (validation.valid) {

        const { search = "%", order_col = 1, order_dir = "asc", page, size = 10 } = args;

        const query = `select
                            usr.id,
                            usr.username,
                            usr.fullname,
                            usr.email,
                            usr.timezone,
                            usr.country,
                            usr.language,
                            usr.enabled,
                            us2.fullname as "created_by",
                            usr.created_ts,
                            usr.enabled
                        from app_sys.users usr
                        left join app_sys.users us2 on (usr.created_by = us2.id)
                        where 1=1
                        and (
                            lower(usr.username) like concat('%', concat(lower(:search), '%')) or
                            lower(usr.fullname) like concat('%', concat(lower(:search), '%')) or
                            lower(usr.email) like concat('%', concat(lower(:search), '%'))
                        )`;

        console.log(query);

        const query_count = `select count(*) as cnt from (${query}) inq`;

        const data_count = await db.sql<{ cnt: number }>({ query: query_count, bind: [search, search, search] });

        // const query = await db.file(`${app_config.basedir}/auth/api/users/sql/users_table.sql`);

        const query_rows = `select * from (${query}) inq 
                            order by ${order_col} ${order_dir}
                            LIMIT ${size}
                            OFFSET ${(page - 1) * size}`;

        const data_rows = await db.sql<DBSystemAuthUsersList>({ query: query_rows, bind: [search, search, search] });

        return {
            error: false,
            code: 1000,
            data: {
                count: data_count[0].cnt,
                rows: data_rows
            }
        };


    } else {

        log.error("Invalid input schema", "system/auth:users_list", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: users_list_input_schema };

    }

};

const user_by_id = async (args: InputSystemAuthUserById, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<OutputSystemAuthUserById | ZombiExecuteReturnSchema | null>> => {

    const validation = validate_schema(user_by_id_input_schema, args);

    if (validation.valid) {

        const id = args;

        const data = await db.select<OutputSystemAuthUserById>({
            table: `${app_config.database.schema}.users`,
            columns: ["id", "username", "fullname", "email", "timezone", "country", "language", "enabled"],
            where: id
        });

        if (data.length > 0) {

            const data_country = data[0].country;
            const country_data = i18n_countries.find((country: string[]) => country[0] === data_country);
            if (country_data) { data[0].country_text = country_data[1]; }

            const data_language = data[0].language;
            const language_data = i18n_languages.find((language) => language[2] === data_language) as [number, string, string];
            if (language_data) { data[0].language_text = language_data[1]; }

            return {
                error: false,
                code: 1000,
                data: data[0]
            };

        } else {

            return {
                error: true,
                code: 1100,
                message: `User not found for ID: ${id}`,
                data: null
            };
        }

    } else {

        log.error("Invalid input schema", "system/auth:user_by_id", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: user_by_id_input_schema };

    }

};

const user_create = async (args: InputSystemAuthUserCreate, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<string | null | ZombiExecuteReturnSchema>> => {

    const validation = validate_schema(user_create_input_schema, args);

    if (validation.valid) {

        const session_user_id = await session.user_id(context.token);

        const user_id = uuid();

        const {
            username,
            fullname,
            email,
            language,
            country,
            timezone,
            enabled,
            password
        } = args;

        await db.insert({
            table: `${app_config.database.schema}.users`,
            values: {
                id: user_id,
                username,
                fullname,
                email,
                language,
                country,
                timezone,
                enabled,
                created_by: session_user_id,
                created_ts: timestamp(),
                password: await security.password_hash(password)
            }
        });

        return {
            error: false,
            code: 1000,
            data: user_id
        };


    } else {

        log.error("Invalid input schema", "system/auth:user_create", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: user_create_input_schema };

    }

};

const user_delete = async (args: InputSystemAuthUserDelete, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const validation = validate_schema(user_delete_input_schema, args);

    if (validation.valid) {

        const id = args;

        if (id === config.security.system_user_id) {

            return {
                error: true,
                code: 1006,
                message: codes.message(1006),
                data: null
            };

        } else {

            const data = await db.delete({
                table: `${app_config.database.schema}.users`,
                where: id
            });

            return {
                error: false,
                code: 1000,
                data
            };

        }

    } else {

        log.error("Invalid input schema", "system/auth:user_delete", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: user_delete_input_schema };

    }

};


const user_edit = async (args: InputSystemAuthUserEdit, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const validation = validate_schema(user_edit_input_schema, args);

    if (validation.valid) {

        const {
            id,
            username,
            fullname,
            email,
            language,
            country,
            timezone,
            enabled,
            password
        } = args;

        if (id === config.security.system_user_id) {

            return {
                error: true,
                code: 1006,
                message: codes.message(1006),
                data: null
            };

        } else {

            const values: Record<string, any> = {
                username,
                fullname,
                email,
                language,
                country,
                timezone,
                enabled,
            };

            if (password) { values.password = await security.password_hash(password); }

            const data = await db.update({
                table: `${app_config.database.schema}.users`,
                values,
                where: id
            });

            return {
                error: false,
                code: 1000,
                data
            };

        }

    } else {

        log.error("Invalid input schema", "system/auth:user_delete", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: user_edit_input_schema };

    }

};

const user_toggle = async (args: InputSystemAuthUserToggle, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<ZombiExecuteReturnSchema | string | null>> => {

    const validation = validate_schema(user_by_id_input_schema, args);

    if (validation.valid) {

        const id = args;

        if (id === config.security.system_user_id) {

            return {
                error: true,
                code: 1007,
                message: codes.message(1007),
                data: null
            };

        } else {

            const data = await db.sql<{ rows: string }>({
                query: `update ${app_config.database.schema}.users set enabled = case when enabled = 'Y' then 'N' else 'Y' end where id = :id`,
                bind: [id]
            });

            await security.reload_cache(context);

            const affected_rows = parseInt(data[0]?.rows ?? "0");

            if (affected_rows > 0) {

                return {
                    error: false,
                    code: 1000,
                    data: `Affected rows: ${affected_rows}`
                };

            } else {

                return {
                    error: true,
                    code: 1100,
                    message: `User not found with ID ${id}`,
                    data: null
                };

            }

        }

    } else {

        log.error("Invalid input schema", "system/auth:user_by_id", context);

        return { error: true, code: 1040, message: `Arguments validation error: ${validation.message}`, data: user_by_id_input_schema };

    }

};

export {
    users_list,
    user_by_id,
    user_create,
    user_delete,
    user_edit,
    user_toggle,
};


// const { page, size, order, search, dir } = args;

// const sql = `select
//                 usr.id,
//                 usr.username,
//                 usr.fullname,
//                 usr.email,
//                 usr.timezone,
//                 usr.country,
//                 usr.language,
//                 usr.enabled,
//                 us2.fullname as "created_by",
//                 usr.created_ts,
//                 usr.enabled
//             from users usr
//             join users us2 on (usr.created_by = us2.id)
//             where 1=1
// 			and (
// 				lower(usr.username) like concat('%', concat(lower(:search), '%')) or
// 				lower(usr.fullname) like concat('%', concat(lower(:search), '%')) or
// 				lower(usr.email) like concat('%', concat(lower(:search), '%'))
//             )`;

/* 
import app_config from "../config";
import codes from "../../../platform/codes";
import i18n_countries from "../../../platform/system/i18n/countries.json";
import i18n_languages from "../../../platform/system/i18n/languages.json";
import i18n_zones from "../../../platform/system/i18n/zones.json";
import session from "../../../platform/system/session";
import db from "../../../platform/persistence/db";
import { send_message_to_user, send_broadcast_message } from "../../../platform/system/websockets";

// import { sql as tsql } from "../shared/tables";
import security from "../../../platform/system/security";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

import { create_save as create_save_action } from "./actions";

const table = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { search } = args;
    // const { page, size, order, search, dir } = args;

    // const sql = `select
    //                 usr.id,
    //                 usr.username,
    //                 usr.fullname,
    //                 usr.email,
    //                 usr.timezone,
    //                 usr.country,
    //                 usr.language,
    //                 usr.enabled,
    //                 us2.fullname as "created_by",
    //                 usr.created_ts,
    //                 usr.enabled
    //             from users usr
    //             join users us2 on (usr.created_by = us2.id)
    //             where 1=1
    // 			and (
    // 				lower(usr.username) like concat('%', concat(lower(:search), '%')) or
    // 				lower(usr.fullname) like concat('%', concat(lower(:search), '%')) or
    // 				lower(usr.email) like concat('%', concat(lower(:search), '%'))
    //             )`;

    const query = await db.file(`${app_config.basedir}/users/sql/users_table.sql`);
                
    const data = await db.sql({ query, bind: [search, search, search] });

    // const data = await tsql({ sql, page, size, order, dir, search });

    // for (const row of data.rows) {

    //     const data_country = row.country;
    //     const country_data = i18n_countries.find(country => country[0] === data_country);
    //     if (country_data) { row.country = country_data[1]; }

    //     const data_language = row.language;
    //     const language_data = i18n_languages.find(language => language[2] === data_language);
    //     if (language_data) { row.language = language_data[1]; }
    
    // }

    return {
        error: false,
        code: 1000,
        data
    };

};

const list = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await db.select({
        table: "users",
        order_by: "fullname"
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const user_by_id = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const data = await db.select<any>({
        table: "users",
        columns: ["id", "username", "fullname", "email", "timezone", "country", "language", "enabled"],
        where: id
    });

    if (data[0]) {

        const data_country = data[0].country;
        const country_data = i18n_countries.find(country => country[0] === data_country);
        if (country_data) { data[0].country_text = country_data[1]; }

        const data_language = data[0].language;
        const language_data = i18n_languages.find(language => language[2] === data_language);
        if (language_data) { data[0].language_text = language_data[1]; }
    
    }

    return {
        error: false,
        code: 1000,
        data: data[0]
    };

};

const languages = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: i18n_languages
    };

};

const countries = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = i18n_countries.sort((a, b) => {
        return b[1] < a[1] ? 1 : -1;
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const timezones = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const country = args;

    const data = i18n_zones.filter(zone => zone[1] === country).sort((a, b) => {
        return b[1] < a[1] ? 1 : -1;
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const timezones_all = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: i18n_zones
    };

};

const edit_save = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const {
        id,
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled,
        password
    } = args;

    const values: any = {
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled
    };

    if (password !== null) { values.password = await security.password_hash(password); }

    const data = await db.update({
        table: "users",
        values,
        where: id
    });

    await send_broadcast_message({ subject: "USERS_TABLE_UPDATED", context });

    return {
        error: false,
        code: 1000,
        data
    };

};

const edit_delete = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const user_name = await db.select<any>({ table: "users", columns: "username", where: id });

    if (user_name[0] && user_name[0].toLowerCase() === "system") {

        return {
            error: true,
            code: 1006,
            data: codes.message(1006),
        };

    } else {

        const data = await db.delete({
            table: "users",
            where: id
        });

        await send_broadcast_message({ subject: "USERS_TABLE_UPDATED", context });
    
        return {
            error: false,
            code: 1000,
            data
        };
    
    }

};

const create_save = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const user_id = await session.user_id(context.token ?? "");

    const {
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled,
        password
    } = args;

    const data = await create_save_action({
        username,
        fullname,
        email,
        language,
        country,
        timezone,
        enabled,
        created_by: user_id ?? "",
        password: await security.password_hash(password)
    });

    await send_broadcast_message({ subject: "USERS_TABLE_UPDATED", context });

    return {
        error: false,
        code: 1000,
        data
    };

};

const toggle_enabled = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    if (id == 0) {

        return {
            error: true,
            code: 1007,
            data: codes.message(1007),
        };

    } else {

        const data = await db.sql({
            query: "update users set enabled = case when enabled = 'Y' then 'N' else 'Y' end where id = :id",
            bind: id
        });

        await security.reload_cache(context);
    
        return {
            error: false,
            code: 1000,
            data
        };
    
    }

};

const send_message = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { user_id, message } = args;

    await send_message_to_user({ user_id, subject: "USER_MESSAGE", data: message, context });

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export {
    table,
    list,
    user_by_id,
    languages,
    countries,
    timezones,
    timezones_all,
    edit_save,
    edit_delete,
    create_save,
    toggle_enabled,
    send_message
};

*/