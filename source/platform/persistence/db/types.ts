export type ZombiDBClientsAbstraction = {
    [key: string]: any
};

export interface ZombiDBReplyDataRow {
    [key: string]: any
}

export type ZombiDBReplyData = ZombiDBReplyDataRow[];

export type ZombiDBSQLBind = (string | number | boolean)[];

export type ZombiDBSQLArguments = {
    query: string,
    bind?: ZombiDBSQLBind,
    db_name?: string,
    identity?: string | boolean
};

export type ZombiDBSQLWhereInput = null | number | string | [string, any] | {[key: string]: any}

export type ZombiDBSQLColumnsInput = null | string | string[];

export type ZombiDBSQLOrderByInput = null | number | string | string[] | number[] | {[key: string]: string};

export type ZombiDBSQLSelectInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    columns?: ZombiDBSQLColumnsInput,
    db_name?: string,
    info?: boolean,
    order_by?: ZombiDBSQLOrderByInput
};

export type ZombiDBSQLSelectCountInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    db_name?: string
};

export type ZombiDBSQLUpdateInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    values: { [key: string]: any },
    db_name?: string
};

export type ZombiDBSQLInsertInput = {
    table: string,
    values: { [key: string]: any },
    db_name?: string,
    identity?: boolean | string
};

export type ZombiDBSQLDeleteInput = {
    table: string,
    where?: ZombiDBSQLWhereInput,
    db_name?: string
};