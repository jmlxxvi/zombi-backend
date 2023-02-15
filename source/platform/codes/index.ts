import log from "../system/log";

import fs from "fs";
import glob from "glob";
import path from "path";
import { ZombiExecuteContextData } from "../../server/types";

type ZombiCodesType = { code: number, message: string };

const codes: ZombiCodesType[] = [];

let are_files_loaded = false;

const load = (context?: ZombiExecuteContextData): boolean => {

    are_files_loaded = true; // TODO we may want to set this after the actual files were loaded

    let error = false;

    const files_path = path.join(__dirname, "../../apps/");

    log.info(`Loading code files from ${files_path}`, "codes/load", context);

    const code_files = glob.sync(`${files_path}/**/codes.json`);

    code_files.forEach(file => {

        const file_codes = JSON.parse(fs.readFileSync(file, { encoding: "utf8", flag: "r" }));

        const duplicated_codes = codes.filter(item => file_codes.map((x: ZombiCodesType) => x.code).includes(item.code));

        if (duplicated_codes.length === 0) {

            log.info(`${file_codes.length} codes found on file ${file}`, "codes/load", context);

            Array.prototype.push.apply(codes, file_codes);

        } else {

            log.error(`Duplicated codes ${duplicated_codes.map((item: ZombiCodesType) => item.code).join(", ")} found on file ${file}`, "codes/load", context);

            error = true;

        }

    });

    return error;

};

const message = (...args: [number, ...string[]]) => {

    if (!are_files_loaded) {

        // load() is executed on server load or on the lambda preambule so this is not used in normal circumstances,
        // but unit tests need this to load on first use.
        load();

    }

    const code = codes.find(x => x.code === args[0]);

    if (code?.message) {

        let message = code.message;

        for(let i = 1; i < args.length; i++) {

            message = message.split("{" + i + "}").join(args[i] as string);

        }

        return message;

    } else {

        const message = `Message not found for code ${args[0]}`;

        log.error(message, "codes/message");

        return message;

    }

};

export default {
    message,
    load
};


