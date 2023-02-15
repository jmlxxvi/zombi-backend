// import app_config from "../config";
import i18n_countries from "../../../platform/system/i18n/countries.json";
import i18n_languages from "../../../platform/system/i18n/languages.json";
import i18n_zones from "../../../platform/system/i18n/zones.json";
// import log from "../../../platform/system/log";

import type { ZombiExecuteContextData, ZombiAPIReturnData } from "../../../server/types";

import { timezone_service_data } from "./service";

export const languages = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    return {
        error: false,
        code: 1000,
        data: i18n_languages
    };

};

export const countries = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = i18n_countries.sort((a: string[], b: string[]): number => {
        return b[1] < a[1] ? 1 : -1;
    });

    return {
        error: false,
        code: 1000,
        data
    };

};

export const timezones = async (args: any, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    if (args?.country) {

        const data = i18n_zones.filter((zone: string[]) => zone[1] === args.country).sort((a: string[], b: string[]): number => {
            return b[1] < a[1] ? 1 : -1;
        });

        return {
            error: false,
            code: 1000,
            data
        };

    } else {

        return {
            error: false,
            code: 1000,
            data: i18n_zones
        };

    }

};

export const timezone_data = async (args: string, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => {

    const data = await timezone_service_data(args);

    if ("error" in data) {

        return {
            error: true,
            code: 1100,
            data: data.error
        };

    } else {

        return {
            error: false,
            code: 1000,
            data
        };

    }

};