import config from "../../config";
import { random_hexa_chars, timestamp, uuid } from "../utils";
import { validate_schema } from "../utils/validators";
import security from ".";

import input_schema from "../../../server/schemas/input.json";
import output_schema from "../../../server/schemas/output.json";
import cache from "../../persistence/cache";
import db from "../../persistence/db";
import { Test_rpc_client } from "../../../tests/client";
import { create_user } from "../../../tests/helpers";

const ts = timestamp();
const executor = uuid();
const request_id = uuid();

const context = { request_id : uuid() };

beforeAll(async () => {

    await cache.connect(context);
    await db.connect(context);

});

afterAll(async () => {

    await cache.disconnect();
    await db.disconnect(context)

});

describe("SECURITY Tests", () => {

    it("Returns a list of modules", async () => {

        const modules = await security.modules_list()
        expect(modules).not.toBeNull();

    });

    it("Returns error on request validation - 1", async () => {
        const request = {};

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'mod'");
    });

    it("Returns error on request validation - 2", async () => {
        const request = {
            "mod": "module"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'fun'");
    });

    it("Returns error on request validation - 4", async () => {

        const request = {
            "mod": "module",
            "fun": "function",
            "other": 999
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must NOT have additional properties");
    });

    it("Returns error on request validation - 5", async () => {

        const request = {
            "mod": 1000,
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/mod must be string");
    });

    it("Returns error on request validation - 6", async () => {
        const request = {
            "mod": "module$",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/mod must match pattern \"^[a-zA-Z0-9-_/]+$\"");
    });

    it("Returns error on request validation - 7", async () => {
        const request = {
            "mod": "module/../wed",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/mod must match pattern \"^[a-zA-Z0-9-_/]+$\"");
    });

    it("Returns error on request validation - 8", async () => {
        const request = {
            "mod": "",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/mod must NOT have fewer than 1 characters");
    });

    it("Returns error on request validation - 9", async () => {
        const request = {
            "mod": null,
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/mod must be string");
    });

    it("Returns error on request validation - 10", async () => {

        const request = {
            "mod": undefined,
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'mod'");
    });

    it("Returns error on request validation - 11", async () => {

        const request = {
            "mod": "module",
            "fun": 1000
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/fun must be string");
    });

    it("Returns error on request validation - 12", async () => {

        const request = {
            "mod": "module",
            "fun": null
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/fun must be string");
    });

    it("Returns error on request validation - 13", async () => {

        const request = {
            "mod": "module",
            "fun": undefined
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'fun'");
    });

    it("Returns error on request validation - 15", async () => {
        const request = {
            "token": null,
            "mod": "module",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/token must be string");
    });

    it("Returns valid request validation - 1", async () => {
        const request = {
            "mod": "module",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 2", async () => {
        const request = {
            "token": Array((config.security.token_size * 2) + 1).join("X"),
            "mod": "module",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 3", async () => {
        const request = {
            "mod": "module/submodule",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 4", async () => {
        const request = {
            "mod": "mod_ule/sub-module",
            "fun": "function"
        };

        const validated = validate_schema(input_schema, request);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns error on response validation - 1", async () => {

        const response = "";
            
        // @ts-ignore
        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must be object");
    });

    it("Returns error on response validation - 2", async () => {

        const response = {};

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'origin'");
    });

    it("Returns error on response validation - 4", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": 1000,
                "code": 1000,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status/error must be boolean");
    });

    it("Returns error on response validation - 5", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": null,
                "code": 1000,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status/error must be boolean");
    });

    it("Returns error on response validation - 6", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": undefined,
                "code": 1000,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status must have required property 'error'");
    });

    it("Returns error on response validation - 7", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": 1,
                "code": 1000,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status/error must be boolean");
    });

    it("Returns error on response validation - 8", async () => {
        
        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": undefined,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status must have required property 'code'");
    });

    it("Returns error on response validation - 9", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status must have required property 'code'");
    });

    it("Returns error on response validation - 10", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "code": null,
                "error": true,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status/code must be number");
    });

    it("Returns error on response validation - 11", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "code": "nonnumber",
                "error": true,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status/code must be number");
    });

    it("Returns error on response validation - 12", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status must have required property 'code'");
    });

    it("Returns error on response validation - 13", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": 1,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'data'");
    });

    it("Returns error on response validation - 14", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": 1,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": undefined,
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'data'");
    });

    it("Returns error on response validation - 15", async () => {

        const response = {
            "status": {
                "error": true,
                "code": 1,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": "the data",
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data must have required property 'origin'");
    });

    it("Returns error on response validation - 16", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": -1,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null,
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeFalsy();
        expect(validated.message).toMatch("data/status must have required property 'timestamp'");
    });


    it("Returns valid response validation - 1", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": -1,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": null,
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns valid response validation - 2", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": true,
                "code": -1,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": [1, 2, 3, "four"],
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Returns valid response validation - 3", async () => {

        const response = {
            "origin": "this/is/the:fun",
            "status": {
                "error": false,
                "code": 0,
                "timestamp": ts,
                "elapsed": -1,
                "request_id": request_id,
                "executor": executor,
            },
            "data": {"an": "object"},
        };

        const validated = validate_schema(output_schema, response);

        expect(validated.valid).toBeTruthy();
        expect(validated.valid).toEqual(expect.any(Boolean));
    });

    it("Checks if encrypted password is in a valid format and matches with unencrypted", async () => {

        const unencrypted_password = "mypassword";

        const encrypted_password = await security.password_hash(unencrypted_password);

        expect(encrypted_password).toEqual(expect.any(String));
        expect(encrypted_password.length).toEqual(161);

        const password_matches = await security.password_compare(unencrypted_password, encrypted_password);

        expect(password_matches).toBeTruthy();
        expect(password_matches).toEqual(expect.any(Boolean));
    });

    it("Checks authorize() when disabled on config", async () => {

        const old_config = config.security.authorize_modules = false;

        const authorized = await security.authorize("test_mod", { request_id: "test" });

        expect(authorized).toEqual(true);

        config.security.authorize_modules = old_config;
    });


    it("Checks authorize() without token", async () => {

        const old_config = config.security.authorize_modules = true;

        const authorized = await security.authorize("test_mod", { request_id: "test" });

        expect(authorized).toEqual(false);

        config.security.authorize_modules = old_config;
    });

    it("Checks authorize() with invalid token, no user_id found", async () => {

        const old_config = config.security.authorize_modules = true;

        const authorized = await security.authorize("test_mod", { token: "invalid_token", request_id: "test" });

        expect(authorized).toEqual(false);

        config.security.authorize_modules = old_config;
    });

    it("Creates user without permissions and checks authorization", async () => {

        const old_config = config.security.authorize_modules = true;

        // const { username, password } = await create_user({}, { permissions: ["system/auth"] });
        const { username, password } = await create_user();

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({
            username,
            password,
        });

        const authorized = await security.authorize("test_mod", { token, request_id: "test" });

        expect(authorized).toEqual(false);

        config.security.authorize_modules = old_config;
    });

    it("Creates user with permissions and checks authorization", async () => {

        const old_config = config.security.authorize_modules = true;

        const mod = "system/auth";

        const { username, password } = await create_user({}, { permissions: [mod] });

        const rpc_client = Test_rpc_client();

        const { token } = await rpc_client.login({
            username,
            password,
        });

        const authorized = await security.authorize(mod, { token, request_id: "test" });

        expect(authorized).toEqual(true);

        config.security.authorize_modules = old_config;
    });

    it("Starts permissions disabled on config", async () => {

        const old_config = config.security.authorize_modules = false;

        const started = await security.start({ request_id });

        expect(started).toEqual(false);

        config.security.authorize_modules = old_config;
    });

    it("Starts app permissions disabled on config", async () => {

        const old_config = config.security.authorize_modules = false;

        const started = await security.start({ request_id });

        expect(started).toEqual(false);

        config.security.authorize_modules = old_config;
    });

    it("Starts app permissions like if it was not loaded", async () => {

        const old_config = config.security.authorize_modules = true;

        const cache_key = `${config.security.cache_key}_SECURITY_STARTED`;

        const security_started = await cache.get(cache_key);

        await cache.del(cache_key);

        const started = await security.start({ request_id });

        expect(started).toEqual(true);

        if (security_started) {
            await cache.set(cache_key, security_started);
        }

        config.security.authorize_modules = old_config;
    });
    
});