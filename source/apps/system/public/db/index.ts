import app_config from "../../config";
import db from "../../../../platform/persistence/db";

interface UserData {
    id: string,
    username: string,
    fullname: string,
    email: string,
    password: string,
    timezone: string,
    country: string,
    language: string,
    enabled: string,
    created_by: string,
    created_ts: number,
    password_recovery_token: string,
    password_recovery_ts: number,
}

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


