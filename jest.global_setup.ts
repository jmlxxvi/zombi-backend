// import config from "./source/platform/config";
// import db from "./source/platform/persistence/db";
import cache from "./source/platform/persistence/cache";
import { uuid } from "./source/platform/system/utils";
// import security from "./source/platform/system/security";

const context = { request_id : uuid() };

export default async () => {
    console.log('\nRunning pre-test tasks');
    await cache.connect(context);
    await cache.flush_db();
    // TODO we may want to delete also database test data from previous test runs
};

