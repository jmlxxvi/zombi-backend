import { ZombiDBSQLBind } from "./types";

export const normalize_bind = (bind: ZombiDBSQLBind | number | string | null | undefined) => {

    return Array.isArray(bind) ? bind : bind ? [bind] : [];

};