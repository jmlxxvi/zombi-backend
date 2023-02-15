// import { yes_or_not } from "../../platform/system/utils";

import base_config from "../../platform/config";

type AppsSystemConfig = {
    basedir: string,
    database: {
        name: string,
        schema: string
    },
    cache: {
        keys: {
            [key: string]: string
        }
    }
}

const config: AppsSystemConfig = {
    basedir: __dirname,
    database: {
        name: "default", // See source/platform/config/index.ts on db entry
        schema: base_config.db.default_schema
    },
    cache: {
        keys: {
            sockets: "ZOMBI_WEBSOCKETS"
        }
    }

};

export default config;