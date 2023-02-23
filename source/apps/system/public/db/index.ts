import app_config from "../../config";
import db from "../../../../platform/persistence/db";

import type { UserData } from "./types";

export const db_user_data = async (
    {
        field,
        value
    }: {
        field: string,
        value: string
    }
): Promise<UserData | null> => {

    const data = await db.select<UserData>({
        table: `${app_config.database.schema}.users`,
        where: {
            [field]: value,
            enabled: "Y"
        },
        db_name: app_config.database.name
    });

    return data[0] ? data[0] : null;
};


