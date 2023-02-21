import { URL } from "node:url";

import config from "../../config";
import log from "../../system/log";
import { uuid } from "../../system/utils";

import { normalize_bind } from "./utils";

import { promises as fs } from "fs";

import type {
    ZombiDBSQLArguments,
    ZombiDBSQLOrderByInput,
    ZombiDBSQLSelectInput,
    ZombiDBSQLSelectCountInput,
    ZombiDBSQLUpdateInput,
    ZombiDBSQLInsertInput,
    ZombiDBSQLDeleteInput,
    ZombiDBSQLBind
} from "./types";

import { ZombiExecuteContextData } from "../../../server/types";

import db_postgresql from "./abstraction/postgresql";

const get_db_url_parts = (db_name: string) => {

    const url_parts = new URL(config.db.databases[db_name].uri);

    return url_parts;

};

const get_db_type = (db_name: string) => {

    const db_type = get_db_url_parts(db_name).protocol.replace(":", "");

    return db_type;

};

/**
 * Connects to the database defined on config
 * See source/core/config
 * @param context - The transaction request ID
 * @return Promise[void]
 */
const connect = async (context: ZombiExecuteContextData) => {

    const databases = Object.keys(config.db.databases);

    for (const db_name of databases) {

        if (config.db.databases[db_name].enabled === true) {

            const db_type = get_db_type(db_name);
            const url_parts = get_db_url_parts(db_name);

            log.info(`Connected to ${db_type} db [${db_name}] ${url_parts.username}@${url_parts.host}${url_parts.pathname}`, "db/connect", context);

            db_postgresql.connect(db_name, context);

        } else {

            log.info(`Database [${db_name}] is disabled in config`, "db/connect", context);

        }

    }

};

/**
 * Diconnects from the database defined on config
 * See source/core/config
 * @param request_id - The transaction request ID
 * @return Promise{void}
 */
const disconnect = async (context: ZombiExecuteContextData) => {

    const databases = Object.keys(config.db.databases);

    for (const db_name of databases) {

        if (config.db.databases[db_name].enabled === true) {

            await db_postgresql.disconnect(db_name);

            log.info(`Disconnected from db [${db_name}]`, "db/disconnect", context);
        }

    }

};

/**
 * Returns the contents of the SQL file stored on source/dba/sql
 * This function is used to use database funtions with the contents fo the file instead of passing the SQL text con as a parameter
 * @param file - The file name
 * @return The file contents
 */
const file = async (file: string): Promise<string> => {

    return (await fs.readFile(file))
        .toString()
        .split(/\r?\n/)
        .filter((line: string) => line.substring(0, 2) !== "--") // To remove SQL comments
        .join("\n");

};

const _sql = async <T>(
    query: string,
    bind: ZombiDBSQLBind,
    db_name: string,
): Promise<T[]> => {

    if (!query) { throw new Error("Empty SQL query text"); }

    const res = await db_postgresql.sql<T>(
        query,
        bind,
        db_name,
    );

    return res;

};

const sql = async <T>({ query, bind = [], db_name = "default" }: ZombiDBSQLArguments): Promise<T[]> => {

    return _sql<T>(query, normalize_bind(bind), db_name);

};

const transaction = async <T>(
    operations: ZombiDBSQLArguments[],
    db_name = "default"
): Promise<T[]> => db_postgresql.transaction<T>(operations, db_name);

const aquire_pool_client = (db_name = "default") => db_postgresql.aquire_pool_client(db_name);

const value = (data: any[]) => data.length > 0 ? data[0][Object.keys(data[0])[0]] : null;

const row = <T>(data: T[]) => data.length > 0 ? data[0] : null;

// type sequence_response = {
//     seq: number
// }

/**
 * Returns the next value from the native sequence
 * @param db_name - The database configured on core/config
 * @return The sequence value
 */
const sequence = async (db_name = config.db.default_db): Promise<number> => {

    const res = await _sql<{ seq: number }>(`select (nextval('${config.db.default_schema}.zombi_seq')::integer) as "seq"`, [], db_name);

    return res[0]["seq"];

};

/**
 * Selects rows from the table passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.columns - The columns to return. See _columns()
 * @param params.db_name - The database configured on core/config
 * @param params.info - The flag indicating the results have additiona info besides the rows returned
 * @param params.order_by - The order of the results. See _order_by()
 * @return An array with the rows returned from the query or an empty array if no rows were found
 */
const select = async <T>({ table, where = null, columns = null, db_name = config.db.default_db, order_by = null }: ZombiDBSQLSelectInput): Promise<T[]> => {

    const { sql_where, bind } = _filter(where);

    const sql_columns = _columns(columns);

    const sql_order_by = _order_by(order_by);

    const sql = `select ${sql_columns} from ${table} where ${sql_where} ${sql_order_by}`;

    const results = await _sql<T>(sql, bind, db_name);

    return results;

};

type count_response = {
    CNT: string
}

/**
 * Counts the rows of a table with the where criteria passed as parameter
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.db_name - The database configured on core/config
 * @return The value found or null if no the query returns empty
 */
const count = async ({ table, where = null, db_name = "default" }: ZombiDBSQLSelectCountInput): Promise<number> => {

    const { sql_where, bind } = _filter(where);

    const sql = `select count(*) as "CNT" from ${table} where ${sql_where}`;

    const results = await _sql<count_response>(sql, bind, db_name);

    return parseInt(results[0].CNT);

};


/**
 * Generates the order by clause to add to the sql query
 * Null means no order
 * A string or a number returns order by the column name or column number defaulted to ascending order
 * An array is converted the columns to order, separated by commas
 * An object uses the keys as columns to order and the values as the sorting direction, like ASC or DESC
 * @param order_by - The order expression
 * @return The order by string to add to the sql query
 */
const _order_by = (order_by: ZombiDBSQLOrderByInput): string => {

    let sql_order_by;

    if (order_by === null) {

        sql_order_by = "";

    } else if (Array.isArray(order_by)) {

        sql_order_by = "order by " + order_by.join(", ");

    } else if (typeof order_by === "object") {

        sql_order_by = "order by ";

        for (const key of Object.keys(order_by)) {

            const order_column = key;

            const order_direction = ((order_by[key] + "").toUpperCase()) === "ASC" ? "ASC" : "DESC";

            sql_order_by += `${order_column} ${order_direction}, `;

        }

        sql_order_by = sql_order_by.slice(0, -2);

    } else {

        sql_order_by = "order by " + order_by;

    }

    return sql_order_by;

};

/**
 * Updates the rows matching the filter criteria from the table passed as parameter
 * The identity parameter defines id the identity column is returned from the function
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.values - An object that represents the values to insert. The keys are the columns and the values the inserted values.
 * @param params.db_name - The database configured on core/config
 * @return The affected rows on the insert operation
 */
const update = async ({ table, where = null, values = {}, db_name = config.db.default_db }: ZombiDBSQLUpdateInput) => {

    const { sql_where, bind } = _filter(where);

    const bind_set: any[] = [];

    const sql_set = Object.keys(values).map(key => { bind_set.push(values[key]); return `${key} = :${key}`; }).join(", ");

    const sql = `update ${table} set ${sql_set} where ${sql_where}`;

    const bind_total = [...bind_set, ...bind];

    const results = await _sql<any>(sql, bind_total, db_name);

    return results;

};

/**
 * Inserts the row defined on the parameter values on the table passed as parameter
 * The identity parameter defines id the identity column is returned from the function
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.values - An object that represents the values to insert. The keys are the columns and the values the inserted values.
 * @param params.db_name - The database configured on core/config
 * @return The affected rows on the insert operation
 */
const insert = async ({ table, values = {}, db_name = config.db.default_db }: ZombiDBSQLInsertInput) => {

    const sql_columns = Object.keys(values).join(", ");
    const sql_values = Object.keys(values).join(", :");

    const bind = Object.values(values);

    const sql = `insert into ${table} (${sql_columns}) values (:${sql_values})`;

    const results = await _sql<any>(sql, bind, db_name);

    return results;

};

/**
 * Deletes the rows matching the filter criteria from the table passed as parameter.
 * We name it _delete because delete is a reserved word on JS.
 * @param params
 * @param params.table - The name of the table to delete from
 * @param params.where - The filter expression, see _filter()
 * @param params.db_name - The database configured on core/config
 * @return The affected rows on the delete operation
 */
const _delete = async ({ table, where = null, db_name = config.db.default_db }: ZombiDBSQLDeleteInput) => {

    const { sql_where, bind } = _filter(where);

    const sql = `delete from ${table} where ${sql_where}`;

    const results = await _sql<any>(sql, bind, db_name);

    return results;

};

/**
 * Returns an string representing a where clause and the bind variables associated with the expression
 * Null means no filter
 * A string or a number represents a comparison with the column id
 * An array is converted from [column1:value1, column2:value2...] to the appropiate filter expresion
 * An object uses the keys as columns and the values as the filtering values
 * @param filter - The filter expression
 * @return The filter expression
 */
const _filter = (filter: null | number | string | string[] | { [key: string]: any }): { sql_where: string, bind: any[] } => {

    let sql_where, index = 1;
    const bind = [];

    if (filter === null) {

        sql_where = "1 = 1";

    } else if (Array.isArray(filter)) {

        let filter_col = filter[0];
        const filter_val = filter[1];
        let filter_op = "=";

        if (filter_col.charAt(0) === "!") {
            filter_col = filter[0].substring(1);
            filter_op = "<>";
        }

        sql_where = `${filter_col} ${filter_op} :${filter_col}`;
        bind.push(filter_val);

    } else if (typeof filter === "object") {

        sql_where = "1 = 1";

        for (const key of Object.keys(filter)) {

            let filter_col = key;
            const filter_val = filter[key];
            let filter_op = "=";

            if (filter_col.charAt(0) === "!") {
                filter_col = filter_col.substring(1);
                filter_op = "<>";
            }

            sql_where += ` and ${filter_col} ${filter_op} :bind${(index++).toString()}`;
            bind.push(filter_val);

        }

    } else {

        sql_where = " id = :id";
        bind.push(filter);

    }

    return { sql_where, bind };

};

/**
 * Returns an string for the columns to be included on the select statement
 * Null value returns *
 * An array is converted to a comma separated string
 * @param columns - The definition of columns on the select
 * @return The columns expression
 */
const _columns = (columns: null | string | string[]): string => {

    let sql_columns;

    if (columns === null) {

        sql_columns = "*";

    } else if (Array.isArray(columns)) {

        sql_columns = columns.join(", ");

    } else {

        sql_columns = columns + "";

    }

    return sql_columns;

};

/**
 * Returns an UUID string to be used as an identifier
 * @return The UUID string
 */
const _uuid = (): string => uuid();

export default {
    sql,
    value,
    row,
    sequence,
    connect,
    disconnect,
    select,
    delete: _delete, // JS reserved word
    insert,
    update,
    file,
    uuid: _uuid,
    count,
    transaction,
    aquire_pool_client,
    get_db_type
};

