import config from "../../config";
// import log from "../log";
import { timestamp, string_end } from "../utils";
import cache from "../../persistence/cache";
import db from "../../persistence/db";
import log from "../log";
import session from "../session";

import { promisify } from "util";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
const scryptAsync = promisify(scrypt);

import path from "path";
import glob from "glob";
import { ZombiExecuteContextData } from "../../../server/types";

const modules_list = async () => {

    const base_path = path.normalize(__dirname + "../../../../apps");

    const files = glob.sync(base_path + "/**/api*", { nodir: false });

    const modules = files
        .filter((file: string) => (!file.includes(".map") && !file.includes(".test.")))
        .map((file: string) => {
            const file_parts = file.replace(base_path, "").split("/");
            return `${file_parts[1]}/${file_parts[2]}`;
        });

    return [...new Set(modules)];

};

const password_hash = async (password: string): Promise<string> => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;

};

const password_compare = async (password: string, hash: string): Promise<boolean> => {
    const [ hashedPassword, salt ] = hash.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(password, salt, 64)) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};

const start = async (context: ZombiExecuteContextData, reload = false): Promise<boolean> => {

    if (config.security.authorize_modules) {

        const security_cache_key = `${config.security.cache_key}_SECURITY_STARTED`;
        const admin_cache_key = `${config.security.cache_key}_ADMINS`;

        const cache_exists = await cache.exists(security_cache_key);

        if (!cache_exists || reload) {
    
            log.debug("Loading permissions data", "security/start", context);
    
            const admins_perms = await db.sql({
                query: `select
                        usr.id::text,
                        usr.fullname,
                        zg.group_name
                    from ${config.db.default_schema}.users usr
                    join ${config.db.default_schema}.groups_to_users zgtu on usr.id = zgtu.user_id
                    join ${config.db.default_schema}.groups zg on zg.id = zgtu.group_id
                    where usr.enabled = 'Y' and zg.id = :id
                    order by 1, 2`,
                bind: [config.security.admin_group_id!]
            });
    
            const users_perms = await db.sql({
                query: `select
                        zgtm.module_name,
                        usr.id::text,
                        usr.fullname,
                        zg.group_name
                    from ${config.db.default_schema}.users usr
                    join ${config.db.default_schema}.groups_to_users zgtu on usr.id = zgtu.user_id
                    join ${config.db.default_schema}.groups zg on zg.id = zgtu.group_id
                    join ${config.db.default_schema}.groups_to_modules zgtm on zg.id = zgtm.group_id
                    where usr.enabled = 'Y'
                    order by 1, 2`
            });
    
            const modules = await modules_list();

            for (const module of modules) {
        
                await cache.del(`${config.security.cache_key}:${module}`);
        
                // TODO type perm object
                const module_auth_users = users_perms.filter((perm: any) => perm.module_name === module).map((perm: any) => perm.id);
        
                if (module_auth_users.length > 0) {
        
                    await cache.generic(
                        "SADD",
                        `${config.security.cache_key}:${module}`,
                        module_auth_users
                    );
        
                }
    
                log.trace(`Permissions for module ${module}: ${JSON.stringify(module_auth_users)}`, "security/start", context);
                
            }
    
            await cache.del(admin_cache_key);
    
            // TODO type perm object
            const module_auth_admins = admins_perms.map((perm: any) => perm.id);
    
            if (module_auth_admins.length > 0) {
        
                await cache.generic(
                    "SADD",
                    admin_cache_key,
                    module_auth_admins
                );
    
            }
        
            await cache.set(security_cache_key, timestamp(true).toString());

            return true;
    
        } else {
    
            log.debug("Permissions already loaded", "security/start", context);

            return false;
    
        }

    } else {

        log.debug("Modules authorization disabled", "security/start", context);

        return false;

    }

};

const reload_cache = async (context: ZombiExecuteContextData) => {

    return start(context, true);

};

const authorize = async (module: string, context: ZombiExecuteContextData): Promise<boolean> => {

    if (config.security.authorize_modules) {

        if (context.token) {

            const user_id = await session.user_id(context.token);

            if (user_id) {

                log.trace(`User ID for token ${string_end(context.token)} is ${string_end(user_id)}`, "security/authorize", context);

                const is_admin = await cache.generic(
                    "SISMEMBER",
                    `${config.security.cache_key}_ADMINS`,
                    user_id
                );

                log.trace(`Cache returned from ${config.security.cache_key}_ADMINS: ${is_admin}`, "security/authorize", context);

                if (is_admin) {

                    log.debug(`User with id ${string_end(user_id)} is admin`, "security/authorize", context);

                    return true;

                } else {

                    const is_authorized = await cache.generic(
                        "SISMEMBER",
                        `${config.security.cache_key}:${module}`,
                        user_id
                    );

                    log.trace(`Cache returned from ${config.security.cache_key}:${module}: ${is_authorized}`, "security/authorize", context);

                    if (is_authorized) {

                        log.debug(`User with id ${user_id} is authorized for ${module}`, "security/authorize", context);

                        return true;

                    } else {

                        log.debug(`User with id ${user_id} is not authorized for ${module}`, "security/authorize", context);

                        return false;

                    }

                }

            } else {

                log.debug(`User ID not found for token ${string_end(context.token)}`, "security/authorize", context);

                return false;

            }

        } else {

            return false;

        }

    } else {

        return true;

    }

};

export default {
    password_hash,
    password_compare,
    start,
    reload_cache,
    authorize,
    modules_list
};