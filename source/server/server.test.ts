import config from "../platform/config";
import { create_user } from "../tests/helpers";
import db from "../platform/persistence/db";
import cache from "../platform/persistence/cache";
import { uuid } from "../platform/system/utils";
import { Test_rpc_client } from "../tests/client";

const context = { request_id : uuid() };

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
    await db.disconnect(context)

});

describe("SERVER Tests", () => {

    it("Returns timeout", async() => {

        const old_timeout = config.server.timeout = 1000;

        const res = await global_rpc_client.call(
            "system/public",
            "timeout"
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1012);

        config.server.timeout = old_timeout;

    });

    it("Returns validation error", async() => {

        const res = await global_rpc_client.call(
            "system/public",
            "output_validation_error"
        );

        expect(res.status.error).toEqual(true);
        expect(res.status.code).toEqual(1100);
        expect(res.status.message).toEqual("Output validation error: data/status must have required property 'error'");
    });

});

