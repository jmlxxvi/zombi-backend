import app_config from "../../../config";
import session from "../../../../../platform/system/session";
import db from "../../../../../platform/persistence/db";
import { uuid, timestamp } from "../../../../../platform/system/utils";
import security from "../../../../../platform/system/security";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../../../server/types";

const table = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const modules = await security.modules_list();

    const data = [];

    for (const module of modules) {

        const permissions = await db.select<any>({
            table: `${app_config.database.schema}.groups_to_modules`,
            where: {
                module_name: module
            }
        });

        const groups = [];

        for (const permission of permissions) {

            groups.push(await db.select<any>({ table: `${app_config.database.schema}.groups`, columns: "group_name", where: permission.group_id }));

        }

        data.push({
            name: module,
            groups: groups.sort(),
            cardinality: groups.length
        });

    }

    return {
        error: false,
        code: 1000,
        data: data
    };

};

const module_groups = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const module_name = args;

    const groups_in = await db.sql({
        query: `select  
                    zg.id, 
                    zg.group_name, 
                    zgtm.module_name
                from ${app_config.database.schema}.groups zg 
                join ${app_config.database.schema}.groups_to_modules zgtm on zg.id = zgtm.group_id 
                where zgtm.module_name = :module_name 
                and zg.group_name <> 'ADMIN'
                order by 2`,
        bind: module_name
    });

    const groups_out = await db.sql({
        query: `select  *
            from groups zg where zg.id not in (
                select zg.id
                from ${app_config.database.schema}.groups zg 
                join ${app_config.database.schema}.groups_to_modules zgtm on zg.id = zgtm.group_id 
                where zgtm.module_name = :module_name
            ) and zg.group_name <> 'ADMIN'
            order by 2`,
        bind: module_name
    });

    return {
        error: false,
        code: 1000,
        data: {
            in: groups_in,
            out: groups_out
        }
    };

};

const permissions_add_group = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { module_name, group_id } = args;

    const data = await db.select({
        table: `${app_config.database.schema}.groups_to_modules`,
        where: {
            module_name,
            group_id
        }
    });

    if (data.length === 0) {

        const session_user_id = await session.user_id(context.token);

        await db.insert({
            table: `${app_config.database.schema}.groups_to_modules`,
            values: {
                id: uuid(),
                group_id,
                module_name,
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

const permissions_remove_group = async (args: any, context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const { module_name, group_id } = args;

    const data = await db.delete({
        table: `${app_config.database.schema}.groups_to_modules`,
        where: {
            module_name,
            group_id
        }
    });

    await security.reload_cache(context);

    return {
        error: false,
        code: 1000,
        data
    };

};

export {
    table,
    module_groups,
    permissions_add_group,
    permissions_remove_group
};
