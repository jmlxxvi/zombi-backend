// import config from "../../../../../platform/config";
import db from "../../../../../platform/persistence/db";
import cache from "../../../../../platform/persistence/cache";
import security from "../../../../../platform/system/security";
import { random_hexa_chars, uuid } from "../../../../../platform/system/utils";
import { create_group, create_user, delete_user } from "../../../../../tests/helpers";
import config from "../../../../../platform/config";
import { Test_rpc_client } from "../../../../../tests/client";

const context = { request_id: uuid() };

const global_rpc_client = Test_rpc_client();

beforeAll(async () => {

    await cache.connect(context);
    await db.connect(context);
    await security.start(context);

    const { username, password } = await create_user({}, { is_admin: true });

    await global_rpc_client.login({
        username, password
    });

});

afterAll(async () => {

    await cache.disconnect();
    await db.disconnect(context);

});

describe("API Tests", () => {

    it("Creates a user and checks if exists, then deletes it and checks if it's gone", async () => {

        const { group_id } = await create_group();

        const { user_id, username } = await create_user({}, {
            group_id,
            permissions: [
                "system/auth"
            ]
        });

        const response_2 = await global_rpc_client.call(
            "system/auth",
            "user_by_id",
            user_id
        );

        expect(response_2.status.error).toEqual(false);
        expect(response_2.status.code).toEqual(1000);
        expect(response_2.data.id).toEqual(user_id);
        expect(response_2.data.username).toEqual(username);

        await delete_user(user_id);

        const response_4 = await global_rpc_client.call(
            "system/auth",
            "user_by_id",
            user_id,
        );

        expect(response_4.status.error).toEqual(true);
        expect(response_4.status.code).toEqual(1100);
        expect(response_4.status.message).toEqual(`User not found for ID: ${user_id}`);
        expect(response_4.data).toBeNull();

    });

    it("Creates a user and tries to execute without permissions", async () => {

        const unique = random_hexa_chars();

        const username = `test_username${unique}`;
        const password = `test_password${unique}`;

        const user_push_notifications_token = `token${unique}`;

        await create_user({
            username,
            password,
        });

        const rpc_client = Test_rpc_client();

        await rpc_client.login({
            username,
            password,
        });

        const response = await rpc_client.call(
            "system/auth",
            "firebase_token_set",
            user_push_notifications_token,
        );

        expect(response.status.error).toEqual(true);
        expect(response.status.code).toEqual(1014);

    });

    it("Get list of users, creates a user and checks if the list changed", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "users_list",
            {
                "search": "%"
            }
        );

        expect(response_1.status.message).toEqual("ok");
        expect(response_1.status.code).toEqual(1000);
        expect(response_1.status.error).toEqual(false);
        expect(Array.isArray(response_1.data.rows)).toBe(true);

        const number_of_users = response_1.data.count;

        await create_user();

        const response_2 = await global_rpc_client.call(
            "system/auth",
            "users_list",
            {
                "search": "%"
            }
        );

        expect(response_2.data.count).toEqual(number_of_users + 1);

    });

    it("Toggles enabled flag and checks if it changed", async () => {

        const { user_id } = await create_user({}, {
            permissions: [
                "system/auth"
            ]
        });

        const response_2 = await global_rpc_client.call(
            "system/auth",
            "user_toggle",
            user_id
        );

        expect(response_2.data).toEqual("Affected rows: 1");

        const response_3 = await global_rpc_client.call(
            "system/auth",
            "user_by_id",
            user_id
        );

        expect(response_3.status.code).toEqual(1000);
        expect(response_3.status.error).toEqual(false);
        expect(response_3.data.enabled).toEqual("N");

    });

    it("Get error trying to delete system user", async () => {

        expect(config.security.system_user_id).not.toBeFalsy();

        const user_id = config.security.system_user_id;

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_delete",
            user_id
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1006);
        expect(response_1.status.message).toEqual("Cannot delete SYSTEM user");

    });

    it("Creates a user and edits user info", async () => {

        const { user_id } = await create_user();

        const unique = random_hexa_chars();

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_edit",
            {
                id: user_id,
                username: `test_user_${unique}`,
                fullname: `Test User ${unique}`,
                email: `test_user_${unique}@mail.com`,
                language: "ru",
                country: "BR",
                timezone: "America/Argentina/Jujuy",
                enabled: "N",
            }
        );

        expect(response_1.status.error).toEqual(false);
        expect(response_1.status.code).toEqual(1000);

        const response_2 = await global_rpc_client.call(
            "system/auth",
            "user_by_id",
            user_id
        );

        expect(response_2.status.error).toEqual(false);
        expect(response_2.status.code).toEqual(1000);
        expect(response_2.data).toEqual({
            id: user_id,
            username: `test_user_${unique}`,
            fullname: `Test User ${unique}`,
            email: `test_user_${unique}@mail.com`,
            language: "ru",
            country: "BR",
            timezone: "America/Argentina/Jujuy",
            enabled: "N",
            country_text: "Brazil",
            language_text: "Русский"
        });

    });

    it("Get error trying to edit system user", async () => {

        expect(config.security.system_user_id).not.toBeFalsy();

        const user_id = config.security.system_user_id;

        const user_data = await create_user();

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_edit",
            {
                id: user_id,
                username: user_data.username,
                fullname: user_data.fullname,
                email: user_data.email,
                language: user_data.language,
                country: user_data.country,
                timezone: user_data.timezone,
                enabled: user_data.enabled,
            }
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1006);
        expect(response_1.status.message).toEqual("Cannot delete SYSTEM user");

    });

    it("Get error trying to toggle system user", async () => {

        expect(config.security.system_user_id).not.toBeFalsy();

        const user_id = config.security.system_user_id;

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_toggle",
            user_id
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1007);
        expect(response_1.status.message).toEqual("Cannot disable SYSTEM user");

    });

    it("Get error trying to toggle inexistent user", async () => {

        const user_id = uuid();

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_toggle",
            user_id
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1100);
        expect(response_1.status.message).toEqual(`User not found with ID ${user_id}`);

    });

});


describe("API Tests Invalid schemas", () => {

    // it("Get invalid input schema error on users_list", async () => {

    //     const response_1 = await global_rpc_client.call(
    //         "system/auth",
    //         "users_list",
    //         {
    //             "search__x": "%"
    //         }
    //     );

    //     expect(response_1.status.error).toEqual(true);
    //     expect(response_1.status.code).toEqual(1040);
    //     expect(response_1.status.message.includes("Arguments validation error: data must have required property")).toBeTruthy();

    // });

    it("Get invalid input schema error on user_by_id", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_by_id",
            null
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1040);
        expect(response_1.status.message).toEqual("Arguments validation error: data must be string");

    });

    it("Get invalid input schema error on user_create", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_create",
            null
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1040);
        expect(response_1.status.message).toEqual("Arguments validation error: data must be object");

    });

    it("Get invalid input schema error on user_delete", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_delete",
            null
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1040);
        expect(response_1.status.message).toEqual("Arguments validation error: data must be string");

    });

    it("Get invalid input schema error on user_toggle", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_toggle",
            null
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1040);
        expect(response_1.status.message).toEqual("Arguments validation error: data must be string");

    });

    it("Get invalid input schema error on user_edit", async () => {

        const response_1 = await global_rpc_client.call(
            "system/auth",
            "user_edit",
            null
        );

        expect(response_1.status.error).toEqual(true);
        expect(response_1.status.code).toEqual(1040);
        expect(response_1.status.message).toEqual("Arguments validation error: data must be object");

    });

});
