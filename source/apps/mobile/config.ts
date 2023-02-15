// import { yes_or_not } from "../../platform/system/utils";

type AppsSystemConfig = {
    basedir: string,
    database: {
        name: string,
        schema: string
    }
}

const config: AppsSystemConfig = {
    basedir: __dirname,
    database: {
        name: "default", // See source/platform/config/index.ts on db entry
        schema: "app_mob"
    }
};

export default config;