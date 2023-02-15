import config from "../../config";
import { timestamp, date_format, uuid } from "../utils";

import type { ZombiLogInput, ZombiLogErrorLevels, ZombiLogErrorMessage } from "./types";
import type { ZombiExecuteContextData } from "../../../server/types";

const error_levels: Record<ZombiLogErrorLevels, number> = {
    "DISABLED": 0,
    "ERROR": 1,
    "INFO": 2,
    "DEBUG": 3,
    "TRACE": 4
};

let last_ts = timestamp(true);

let log_uuid = uuid();

const set_uuid = (uuid: string) => (log_uuid = uuid);
const get_uuid = () => log_uuid;

const error_type = (level: number) => {

    let error_type_label: string;

    switch (level) {
    case 1: error_type_label = "ERROR"; break;
    case 2: error_type_label = "INFO"; break;
    case 3: error_type_label = "DEBUG"; break;
    case 4: error_type_label = "TRACE"; break;
    default: error_type_label = "NONE"; break;
    }

    return error_type_label;

};

const error_icon = (level: number) => {

    let log_icon = "";

    if (config.log.show_icons) {
        switch (level) {
        case 1: log_icon = "🔴"; break;
        case 2: log_icon = "🟢"; break;
        case 3: log_icon = "🔵"; break;
        case 4: log_icon = "🟣"; break;
        default: log_icon = "🟢"; break;
        }
        log_icon += " ";
    }

    return log_icon;

};

const _log = async (message: ZombiLogErrorMessage, subject = "UNKNOWN", level: number, context?: ZombiExecuteContextData): Promise<void> => {

    if (level === -1 || error_levels[config.log.level] >= level) {

        const rid: string = context?.request_id ? context.request_id : log_uuid;

        const current_ts: number = timestamp(true);
        const delta_ts: number = current_ts - last_ts;

        last_ts = current_ts;

        const message_timestamp = (config.log.show_timestamp) ? date_format(new Date(), "%Y-%m-%d %H:%M:%S.%x", true) : "";

        let msg: string;

        if (message instanceof Error || (typeof message === "object" && "stack" in message)) {

            msg = message.stack ? message.stack.toString() : "Missing stack data";

        } else if (typeof message === "string") {

            msg = message;

        } else { msg = "Incorrect message type for logging"; }

        const error_type_console = error_type(level);
        
        const error_icon_console = error_icon(level);

        console.log(`${error_icon_console}${error_type_console} ${message_timestamp} [${rid}] [${subject}] ${msg.replace(/(?:\r\n|\r|\n)/g, "")} [${delta_ts.toString()}]`);

    }

};

const always: ZombiLogInput = (message, subject, context) => { _log(message, subject, -1, context); };
const error: ZombiLogInput = (message, subject, context) => { _log(message, subject, 1, context); };
const info: ZombiLogInput = (message, subject, context) => { _log(message, subject, 2, context); };
const debug: ZombiLogInput = (message, subject, context) => { _log(message, subject, 3, context); };
const trace: ZombiLogInput = (message, subject, context) => { _log(message, subject, 4, context); };

export default {
    always,
    error,
    info,
    debug,
    trace,
    set_uuid,
    get_uuid
};

