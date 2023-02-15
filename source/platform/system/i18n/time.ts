import config from "../../config";

import { DateTime } from "luxon";

export const ts2date = (
    {
        timestamp, 
        timezone = config.i18n.default_timezone, 
        format = "cccc, LLLL dd yyyy, HH:mm:ss"
    }:
    {
        timestamp: number, 
        timezone?: string, 
        format?: string
    }
): string => DateTime.fromMillis(timestamp).setZone(timezone).toFormat(format.toString());