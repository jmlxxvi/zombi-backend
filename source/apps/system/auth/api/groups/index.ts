import app_config from "../../../config";
import codes from "../../../../../platform/codes";
import session from "../../../../../platform/system/session";
import db from "../../../../../platform/persistence/db";
import { uuid, timestamp } from "../../../../../platform/system/utils";
import security from "../../../../../platform/system/security";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../../../server/types";

export const groups_list = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await db.select({
        table: `${app_config.database.schema}.groups`,
        order_by: "group_name"
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

export const groups_by_id = async (args: string, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const data = await db.select({
        table: `${app_config.database.schema}.groups`,
        columns: ["id", "group_name", "description"],
        where: id
    });

    return {
        error: false,
        code: 1000,
        data: data[0] ? data[0] : null
    };

};

export const groups_by_name = async (args: string, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const group_name = args;

    const data = await db.select({
        table: `${app_config.database.schema}.groups`,
        where: {
            group_name
        }
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

export const groups_edit_save = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const {
        id,
        group_name,
        description
    } = args;

    const data = await db.update({
        table: `${app_config.database.schema}.groups`,
        values: {
            group_name,
            description
        },
        where: id
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

export const groups_edit_delete = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const group_name = await db.select<any>({ table: `${app_config.database.schema}.groups`, columns: "group_name", where: id });

    if (group_name[0] && group_name[0].toLowerCase() === "admin") {

        return {
            error: true,
            code: 1008,
            data: codes.message(1008),
        };

    } else {

        const data = await db.delete({
            table: `${app_config.database.schema}.groups`,
            where: id
        });
    
        return {
            error: false,
            code: 1000,
            data
        };
    
    }

};

export const groups_create_save = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const user_id = await session.user_id(context.token);

    const group_id = uuid();

    const {
        group_name,
        description
    } = args;

    await db.insert({
        table: `${app_config.database.schema}.groups`,
        values: {
            id: group_id,
            group_name,
            description,
            created_by: user_id,
            created_ts: timestamp()
        }
    });

    return {
        error: false,
        code: 1000,
        data: group_id
    };

};

export const groups_users = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const group_id = args;

    const users_in = await db.sql({
        query: `select id::text, fullname from ${app_config.database.schema}.users where id in (select user_id from ${app_config.database.schema}.groups_to_users where group_id = :group_id) order by 2`,
        bind: group_id
    });

    const users_out = await db.sql({
        query: `select id::text, fullname from ${app_config.database.schema}.users where id not in (select user_id from ${app_config.database.schema}.groups_to_users where group_id = :group_id) order by 2`,
        bind: group_id
    });

    return {
        error: false,
        code: 1000,
        data: {
            in: users_in,
            out: users_out
        }
    };

};

export const groups_delete_user = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { group_id, user_id } = args;

    await db.delete({
        table: `${app_config.database.schema}.groups_to_users`,
        where: {
            user_id,
            group_id
        }
    });

    await security.reload_cache(context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export const groups_add_user = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { group_id, user_id } = args;

    const data = await db.select({
        table: `${app_config.database.schema}.groups_to_users`,
        where: {
            user_id,
            group_id
        }
    });

    if (data.length === 0) {

        const session_user_id = await session.user_id(context.token);

        await db.insert({
            table: `${app_config.database.schema}.groups_to_users`,
            values: {
                id: uuid(),
                group_id,
                user_id,
                created_by: session_user_id,
                created_ts: timestamp()
            }
        });

    }

    await security.reload_cache(context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

/* 
import codes from "../../../platform/codes";
import session from "../../../platform/system/session";
import db from "../../../platform/persistence/db";
import { uuid, timestamp } from "../../../platform/system/utils";
import security from "../../../platform/system/security";

import { sql as tsql } from "../shared/tables";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

const table = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { page, size, order, search, dir } = args;

    const query = `select
                    grp.id,
                    grp.group_name,
                    grp.description,
                    us2.fullname as "created_by",
                    grp.created_ts,
                    (select count(*) from groups_to_users gtu where gtu.group_id = grp.id) as "cardinality" 
                from groups grp
                join users us2 on (grp.created_by = us2.id)
                where 1=1
				and (
					lower(grp.group_name) like concat('%', concat(lower(:search), '%')) or
                    lower(grp.description) like concat('%', concat(lower(:search), '%'))
                )`;

    const data = await tsql({ query, page, size, order, dir, search });

    return {
        error: false,
        code: 1000,
        data
    };

};

const list = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await db.select({
        table: "groups",
        order_by: "group_name"
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const group_by_id = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const data = await db.select({
        table: "groups",
        columns: ["id", "group_name", "description"],
        where: id
    });

    return {
        error: false,
        code: 1000,
        data: data[0]
    };

};

const edit_save = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const {
        id,
        group_name,
        description
    } = args;

    const data = await db.update({
        table: "groups",
        values: {
            group_name,
            description
        },
        where: id
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const edit_delete = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const id = args;

    const group_name = await db.select<any>({ table: "groups", columns: "group_name", where: id });

    if (group_name[0] && group_name[0].toLowerCase() === "admin") {

        return {
            error: true,
            code: 1008,
            data: codes.message(1008),
        };

    } else {

        const data = await db.delete({
            table: "groups",
            where: id
        });
    
        return {
            error: false,
            code: 1000,
            data
        };
    
    }

};

const create_save = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const user_id = await session.user_id(context.token);

    const {
        group_name,
        description
    } = args;

    const data = await db.insert({
        table: "groups",
        values: {
            id: uuid(),
            group_name,
            description,
            created_by: user_id,
            created_ts: timestamp()
        }
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

const group_users = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const group_id = args;

    const users_in = await db.sql({
        query: "select id::text, fullname from users where id in (select user_id from groups_to_users where group_id = :group_id) order by 2",
        bind: group_id
    });

    const users_out = await db.sql({
        query: "select id::text, fullname from users where id not in (select user_id from groups_to_users where group_id = :group_id) order by 2",
        bind: group_id
    });

    return {
        error: false,
        code: 1000,
        data: {
            in: users_in,
            out: users_out
        }
    };

};

const group_delete_user = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { group_id, user_id } = args;

    await db.delete({
        table: "groups_to_users",
        where: {
            user_id,
            group_id
        }
    });

    await security.reload_cache(context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

const group_add_user = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { group_id, user_id } = args;

    const data = await db.select({
        table: "groups_to_users",
        where: {
            user_id,
            group_id
        }
    });

    if (data.length === 0) {

        const session_user_id = await session.user_id(context.token);

        await db.insert({
            table: "groups_to_users",
            values: {
                id: uuid(),
                group_id,
                user_id,
                created_by: session_user_id,
                created_ts: timestamp()
            }
        });

    }

    await security.reload_cache(context);

    return {
        error: false,
        code: 1000,
        data: null
    };

};

export {
    table,
    list,
    group_by_id,
    edit_save,
    edit_delete,
    create_save,
    group_users,
    group_delete_user,
    group_add_user
};

*/