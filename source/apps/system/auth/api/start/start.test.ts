// import config from "../../../../../platform/config";
import db from "../../../../../platform/persistence/db";
import cache from "../../../../../platform/persistence/cache";
import { random_hexa_chars, uuid } from "../../../../../platform/system/utils";
import session from "../../../../../platform/system/session";
import { Test_rpc_client } from "../../../../../tests/client";
import { create_user } from "../../../../../tests/helpers";

const context = { request_id: uuid() };

const global_rpc_client = Test_rpc_client();

beforeAll(async () => {

    await cache.connect(context);
    await db.connect(context);

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

    it("Creates a user and starts the application", async () => {

        const unique = random_hexa_chars();

        const fullname = `test_ fullname${unique}`;

        const { username, password } = await create_user({ fullname }, { permissions: ["system/auth"] });

        const rpc_client = Test_rpc_client();

        await rpc_client.login({
            username,
            password,
        });

        const response_1 = await rpc_client.call(
            "system/auth",
            "start",
            "some_push_notifications_token",
        );

        expect(response_1.status.error).toEqual(false);
        expect(response_1.status.code).toEqual(1000);
        expect(response_1.data.fullname).toEqual(fullname);

    });


    it("Creates a user setting the notification token and check the token is set on the session", async () => {

        const unique = random_hexa_chars();

        const user_push_notifications_token = `token${unique}`;

        const { username, password } = await create_user({}, { permissions: ["system/auth"] });

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({
            username,
            password
        });

        const response = await rpc_client.call(
            "system/auth",
            "firebase_token_set",
            user_push_notifications_token,
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);

        const saved_push_notifications_token = await session.get(token, "push_notifications_token");

        expect(saved_push_notifications_token).toEqual(user_push_notifications_token);

    });

});


