import config from "../platform/config";
import db from "../platform/persistence/db";
import { uuid } from "../platform/system/utils";

(async () => {

    const schema = config.db.default_schema;

    const request_id = uuid();

    await db.connect({ request_id });

    await db.sql({
        query: `delete from ${schema}.groups_to_modules where group_id in (select id from ${schema}.groups where group_name like 'test_group_%')`
    });

    await db.sql({
        query: `delete from ${schema}.groups_to_users where group_id in (select group_id from ${schema}.groups where group_name like 'test_group_%')`
    });
    
    await db.sql({
        query: `delete from ${schema}.users where email like 'test_user_%'`
    });

    await db.sql({
        query: `delete from ${schema}.groups where group_name like 'test_group_%'`
    });
    
    await db.disconnect({ request_id });
    
})();