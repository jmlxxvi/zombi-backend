import app_config from "../config";
import db from "../../../platform/persistence/db";

export const user_data = async (
    {
        field,
        value
    }: {
        field: string,
        value: string
    }
): Promise<any> => {

    const data = await db.select<any>({
        table: `${app_config.database.schema}.users`,
        where: {
            [field]: value,
            enabled: "Y"
        },
        db_name: app_config.database.name
    });

    return data;
};


