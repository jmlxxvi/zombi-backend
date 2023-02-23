import type { AppsSystemConfig } from "./types";

const config: AppsSystemConfig = {
    basedir: __dirname,
    database: {
        name: "default", // See source/platform/config/index.ts on db entry
        schema: "app_mob"
    }
};

export default config;