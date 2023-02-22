// import config from "../../../../platform/config";
import { Test_rpc_client } from "../../../../tests/client";
import db from "../../../../platform/persistence/db";
import cache from "../../../../platform/persistence/cache";
import { uuid } from "../../../../platform/system/utils";
import security from "../../../../platform/system/security";
import session from "../../../../platform/system/session";

const context = { request_id: uuid() };

beforeAll(async () => {

    await cache.connect(context);
    await db.connect(context);
    await security.start(context);

});

afterAll(async () => {

    await cache.disconnect();
    await db.disconnect(context);

});

const rpc_client = Test_rpc_client();

describe("API Tests", () => {

    it("Returns health check alive response", async () => {

        const res = await rpc_client.call(
            "system/public",
            "health"
        );

        expect(res.status.error).toEqual(false);
        expect(res.status.code).toEqual(1000);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.data).toEqual("alive");

    });

    it("Responds with an encripted password", async () => {

        const res = await rpc_client.call(
            "system/public",
            "hash",
            "not_relevant"
        );

        expect(res.status.error).toEqual(false);
        expect(res.status.code).toEqual(1000);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.data).toHaveLength(161);

    });

    it("Responds with 'Cannot login' and code 1004 - bad user", async () => {

        const res = await rpc_client.call(
            "system/public",
            "login",
            { username: "non_existing_users", password: "wrongpassword" }
        );



        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1004);
        expect(res.status.message).toEqual("Cannot login");

    });

    it("Responds with 'Cannot login' and code 1004 - bad password", async () => {

        const res = await rpc_client.call(
            "system/public",
            "login",
            { username: "system", password: "wrongpassword" }
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1004);
        expect(res.status.message).toEqual("Cannot login");

    });

    it("Responds with 'Input validation error'", async () => {

        const res = await rpc_client.call(
            "system/public",
            "login",
            { username: "system", password__x: "wrongpassword" }
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1040);
        expect(res.status.message).toEqual("Input validation error");

    });

    it("Returns error on invalid language", async () => {

        const res = await rpc_client.call(
            "system/public",
            "login",
            {
                username: process.env.ZOMBI_TEST_USER_NAME,
                password: process.env.ZOMBI_TEST_USER_PASSWORD,
                language: "XX"
            }
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1005);
        expect(res.status.message).toEqual("Invalid language: XX");

    });

    it("Logs in with test user and returns token", async () => {

        await rpc_client.login();

    });

    it("Returns 'Function not found' from tests module", async () => {

        const res = await rpc_client.call(
            "system/public",
            "invalid_function_name"
        );

        expect(res.status.code).toEqual(1003);
        expect(res.status.error).toEqual(true);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.status.message).toEqual("Cannot execute system/public:invalid_function_name");

    });

    it("Returns 'pong' from tests module", async () => {

        const res = await rpc_client.call(
            "system/tests",
            "ping",
        );

        expect(res.status.code).toEqual(1000);
        expect(res.status.error).toEqual(false);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.data).toEqual("pong");

    });

    it("Returns response from echo test function", async () => {

        const res = await rpc_client.call(
            "system/public",
            "echo",
            "echo,echo,echo"
        );

        expect(res.status.error).toEqual(false);
        expect(res.status.code).toEqual(1000);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.data).toEqual("echo,echo,echo");

    });

    it("Tries to logoff with invalid token", async () => {

        const token = rpc_client.get_token();

        const user_id = await session.get(token!, "user_id");
        await session.del(token!, "user_id");

        const res = await rpc_client.call(
            "system/public",
            "logoff",
        );

        console.log(res);
        console.log(res.status);
        console.log(res.status.error);

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1002);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.status.message).toEqual("Invalid token");

        // rpc_client.set_token(valid_token);
        await session.set(token!, "user_id", user_id!);

    });

    it("Returns code 1001 after logoff", async () => {

        await rpc_client.logoff();

        const res = await rpc_client.call(
            "system/tests",
            "ping",
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1001);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.status.message).toEqual("Invalid session");

    });

    // This should be de last test as it is clearing the token
    it("Returns code 1002 after token cleared", async () => {

        rpc_client.set_token(null);

        const res = await rpc_client.call(
            "system/tests",
            "ping",
        );

        expect(res.status.code).toEqual(1002);
        expect(res.status.error).toEqual(true);
        expect(res.status.message).toEqual(expect.any(String));
        expect(res.status.message).toEqual("Invalid token");

    });

});

