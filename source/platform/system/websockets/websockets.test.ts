// import config from "../../../platform/config";
import db from "../../persistence/db";
import cache from "../../persistence/cache";
import { random_hexa_chars, uuid } from "../utils";
import { create_user } from "../../../tests/helpers";
import { cache_prefix, send_broadcast_message, send_message_to_user } from ".";
import security from "../security";
import session from "../session";

import { Test_rpc_client } from "../../../tests/client";

const context = { request_id: uuid() };

import { send_message_to_session } from "./index";

import aws from "../../cloud/aws";
jest.mock("../../cloud/aws");

beforeAll(async () => {
    await cache.connect(context);
    await db.connect(context);
    await security.start(context);
});

afterAll(async () => {
    await cache.disconnect();
    await db.disconnect(context);
});

describe("API Tests", () => {

    it("Sends WS message to session with mocked AWS", async () => {

        console.log(await db.sql({ query: "select 2" }));

        (aws.send_ws_message as any).mockResolvedValue(undefined);

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const cache_data = { token, domain_name: "test_domain", stage: "test_stage" };

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        await cache.generic("HSET", cache_prefix() + connection_id, cache_data);

        const subject = "Test subject";
        const data = "Test data";

        const results = await send_message_to_session({ token, subject, data, context });

        expect(results).toEqual(true);

    });

    it("Sends WS message to session without connection_id with mocked AWS", async () => {

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const subject = "Test subject";

        const results = await send_message_to_session({ token, subject, context });

        expect(results).toEqual(false);

    });

    it("Sends WS message to session without connection_data with mocked AWS", async () => {

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        const data = "Test data";

        const results = await send_message_to_session({ token, data, context });

        expect(results).toEqual(false);

    });

    it("Sends WS message to user with mocked AWS", async () => {

        (aws.send_ws_message as any).mockResolvedValue(undefined);

        const { user_id, username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const cache_data = { token, domain_name: "test_domain", stage: "test_stage" };

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        await cache.generic("HSET", cache_prefix() + connection_id, cache_data);

        const subject = "Test subject";
        const data = "Test data";

        const results = await send_message_to_user({ user_id, subject, data, context });

        expect(results).toEqual(true);

    });

    it("Sends WS message to user without session and data with mocked AWS", async () => {

        const { user_id } = await create_user();

        const subject = "Test subject";

        const results = await send_message_to_user({ user_id, subject, context });

        expect(results).toEqual(false);

    });

    it("Sends WS message to user without session as subject with mocked AWS", async () => {

        const { user_id } = await create_user();

        const data = "Test data";

        const results = await send_message_to_user({ user_id, data, context });

        expect(results).toEqual(false);

    });

    it("Sends broadcast WS message with mocked AWS", async () => {

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        const data = "Test data";
        const subject = "Test data";

        const results = await send_broadcast_message({ subject, data, context, who_am_i: token });

        expect(results.filter((x: boolean) => x).length).toEqual(2);

    });

    it("Sends broadcast WS message without subject with mocked AWS", async () => {

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        const data = "Test data";

        const results = await send_broadcast_message({ data, context, who_am_i: token });

        expect(results.filter((x: boolean) => x).length).toEqual(2);

    });

    it("Sends broadcast WS message without data with mocked AWS", async () => {

        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({ username, password });

        const connection_id = random_hexa_chars();

        await session.set(token, "connection_id", connection_id);

        const subject = "Test data";

        const results = await send_broadcast_message({ subject, context, who_am_i: token });

        expect(results.filter((x: boolean) => x).length).toEqual(2);

    });

});
