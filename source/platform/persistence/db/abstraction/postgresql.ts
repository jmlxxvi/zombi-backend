import config from "../../../config";
import log from "../../../system/log";

import { normalize_bind } from "../utils";

// https://node-postgres.com/
import { Pool } from "pg";

import type { ZombiDBClientsAbstraction, ZombiDBSQLArguments, ZombiDBSQLBind } from "../types";
import { ZombiExecuteContextData } from "../../../../server/types";

const pools: ZombiDBClientsAbstraction = {};

const normalize_query = (query: string): string => {

    let bind_count = 0;

    // This is to use Oracle's style bindvars, meaning colon prefixed words as bind variables on the SQL text
    // so this transforms a SQL text like "where id = :id" to "where id = $1"
    // Please note that PG uses double colon for casting, for example column::integer so we check for it
    return query.replace(/'[^']+'|(:\S*\w)/g, (x, group1) => {
        if (!group1) { return x; }
        else if (x.indexOf("::") === -1) { return "$" + (++bind_count); }
        else { return x; }
    });

};

const get_response = (res: any) => {

    let response: any;

    if (res.command === "SELECT") { response = res.rows; }

    else {

        response = { rows: res.rowCount };

        response = [response];

    }

    return response;

};

const pool_config = (db_name: string) => {

    const uri = config.db.databases[db_name].uri;

    return {
        connectionString: uri,
        // all valid client config options are also valid here
        // in addition here are the pool specific configuration parameters:
        // number of milliseconds to wait before timing out when connecting a new client
        // by default this is 0 which means no timeout
        connectionTimeoutMillis: 10000,
        // number of milliseconds a client must sit idle in the pool and not be checked out
        // before it is disconnected from the backend and discarded
        // default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients
        idleTimeoutMillis: 10000,
        // maximum number of clients the pool should contain
        // by default this is set to 10.
        max: config.db.databases[db_name].pool_size,
        // Default behavior is the pool will keep clients open & connected to the backend 
        // until idleTimeoutMillis expire for each client and node will maintain a ref 
        // to the socket on the client, keeping the event loop alive until all clients are closed 
        // after being idle or the pool is manually shutdown with `pool.end()`.
        //
        // Setting `allowExitOnIdle: true` in the config will allow the node event loop to exit 
        // as soon as all clients in the pool are idle, even if their socket is still open 
        // to the postgres server.  This can be handy in scripts & tests 
        // where you don't want to wait for your clients to go idle before your process exits.
        // allowExitOnIdle: boolean
    };

};

const connect = (db_name: string, context: ZombiExecuteContextData): void => {

    if (typeof pools[db_name] === "undefined") {

        pools[db_name] = new Pool(pool_config(db_name));

        // pools[db_name].on("error", (error: Error, client: PoolClient) => {
        pools[db_name].on("error", async (error: Error) => {
            log.error(error, "postgresql/connect", context);
        });

        // pools[db_name].on("acquire", (client: PoolClient) => {
        pools[db_name].on("acquire", () => {
            // TODO we may want to alert on high "waiting" clients, that usually means the pool size is too small and/or transactions rate it too high
            log.trace(`DB client was acquired for database [${db_name}], total/idle/waiting: ${pools[db_name].totalCount}/${pools[db_name].idleCount}/${pools[db_name].waitingCount}`, "db/postgresql/connect", context);
        });

        // pools[db_name].on("remove", (client: PoolClient) => {
        pools[db_name].on("remove", () => {
            log.trace(`DB client was removed for database [${db_name}], total/idle/waiting: ${pools[db_name].totalCount}/${pools[db_name].idleCount}/${pools[db_name].waitingCount}`, "db/postgresql/connect", context);
        });

    }

};

const sql = async <T>(
    query: string,
    bind: ZombiDBSQLBind,
    db_name: string,
): Promise<T[]> => {

    if (pools[db_name]) {

        const pgized_sql = normalize_query(query);

        try {

            const response: any = await pools[db_name].query({ text: pgized_sql, values: bind });

            return get_response(response);

        } catch (error) {

            const message = `${error.message} SQL: ${pgized_sql} BIND: [${bind.join(", ")}]`;

            // https://www.postgresql.org/docs/current/errcodes-appendix.html 
            throw new Error(message);

        }

    } else {

        throw new Error(`Database ${db_name} is not connected`);

    }

};

const transaction = async <T>(
    operations: ZombiDBSQLArguments[],
    db_name: string
): Promise<T[]> => {

    // note: we don't try/catch this because if connecting throws an exception
    // we don't need to dispose of the client (it will be undefined)
    const client = await pools[db_name].connect();

    try {

        const reply: T[] = [];

        await client.query("BEGIN");

        for (const operation of operations) {

            const pgized_sql = normalize_query(operation.query);

            const response = await client.query(pgized_sql, normalize_bind(operation.bind));

            reply.push(response);

        }

        await client.query("COMMIT");

        return reply;

    } catch (error) {

        await client.query("ROLLBACK");

        throw new Error(error.message);

    } finally { client.release(); }

};

const aquire_pool_client = async (db_name: string) => {

    const client = await pools[db_name].connect();

    return {

        sql: async <T>({ query, bind, identity = false }: ZombiDBSQLArguments): Promise<T[]> => {

            try {

                let pgized_sql = normalize_query(query);

                let identity_column: null | string = null;

                if (identity === true) { identity_column = "id"; }
                else if (typeof identity === "string") { identity_column = identity; }

                if (identity_column !== null) {
                    pgized_sql += ` returning ${identity_column}`;
                }

                const res = await client.query(pgized_sql, normalize_bind(bind));

                const response: T[] = get_response(res);

                return response;

            } catch (error) { throw new Error(error.message); }

        },

        release_pool_client: (): void => { client.release(); }

    };

};

const disconnect = async (db_name: string): Promise<void> => {
    if (pools[db_name]) {
        await pools[db_name].end();
    }
};

export default {
    connect,
    sql,
    disconnect,
    transaction,
    aquire_pool_client
};