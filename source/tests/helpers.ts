import config from "../platform/config";
import session from "../platform/system/session";
import { validate_uuid } from "../platform/system/utils/validators";
import { uuid, random_hexa_chars } from "../platform/system/utils";

import { ZombiExecuteContextData, ZombiExecuteReturnData } from "../server/types";

import nock from "nock";
import { execute } from "../server/execute";

let _system_token: string | null = null;

const executor_uuid = uuid();
const remote_ip = "127.0.0.1";

export const call_system_rpc = async (mod: string, fun: string, args?: any): Promise<ZombiExecuteReturnData<any>> => {

    const request_id = uuid();

    const context: ZombiExecuteContextData = {
        request_id,
        remote_ip,
        executor_uuid,
    };

    if (!_system_token) {

        const response = await execute({
            mod: "system/public",
            fun: "login",
            args: {
                username: process.env.ZOMBI_TEST_USER_NAME!,
                password: process.env.ZOMBI_TEST_USER_PASSWORD!,
            }
        }, context);

        _system_token = response.data.token;

        if (response?.status?.error) { console.error(response); }

    }

    const params: {
        mod: string,
        fun: string,
        args: any,
        token: string
    } = {
        mod,
        fun,
        args,
        token: _system_token!
    };

    return execute(params, context);

};

export const create_user = async (user = {}, options = {}) => {

    const unique = random_hexa_chars();

    const base_user = {
        username: `test_user_${unique}`,
        fullname: `Test User ${unique}`,
        email: `test_user_${unique}@mail.com`,
        language: "es",
        country: "AR",
        timezone: "America/Argentina/Buenos_Aires",
        enabled: "Y",
        password: `pass_${unique}`,
        ...user
    };

    const response = await call_system_rpc(
        "system/auth",
        "user_create",
        base_user,
    );

    if (response?.status?.error) { console.error(response); }

    expect(response.status.error).toEqual(false);
    expect(response.status.code).toEqual(1000);
    expect(response.status.message).toEqual("ok");
    expect(validate_uuid(response.data)).toBeTruthy;

    const user_id = response.data;

    const base_options = {
        create_group: true,
        group_id: null,
        permissions: [],
        is_admin: false,
        ...options
    };

    if (base_options.is_admin) {

        const response = await call_system_rpc(
            "system/auth",
            "groups_add_user",
            { group_id: config.security.admin_group_id, user_id },
        );

        if (response?.status?.error) { console.error(response); }
        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);

    }

    if (base_options.group_id) {

        const response = await call_system_rpc(
            "system/auth",
            "groups_by_id",
            base_options.group_id,
        );

        if (response?.status?.error) { console.error(response); }
        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.id).toEqual(base_options.group_id);

        const { id: group_id } = response.data;

        const response2 = await call_system_rpc(
            "system/auth",
            "groups_add_user",
            { user_id, group_id }
        );

        if (response2?.status?.error) { console.error(response2); }
        expect(response2.status.error).toEqual(false);
        expect(response2.status.code).toEqual(1000);

        if (base_options.permissions.length > 0) {

            for (const module_name of base_options.permissions) {

                const response = await call_system_rpc(
                    "system/auth",
                    "permissions_add_group",
                    { module_name, group_id },
                );

                if (response?.status?.error) { console.error(response); }
                expect(response.status.error).toEqual(false);
                expect(response.status.code).toEqual(1000);

            }

        }

        return { ...base_user, group_id, unique, user_id };

    } else if (base_options.create_group && !base_options.is_admin) {

        const { group_id } = await create_group();

        if (base_options.permissions.length > 0) {

            const response2 = await call_system_rpc(
                "system/auth",
                "groups_add_user",
                { user_id, group_id }
            );
    
            if (response2?.status?.error) { console.error(response2); }
            expect(response2.status.error).toEqual(false);
            expect(response2.status.code).toEqual(1000);

            for (const module_name of base_options.permissions) {

                const response = await call_system_rpc(
                    "system/auth",
                    "permissions_add_group",
                    { module_name, group_id },
                );

                if (response?.status?.error) { console.error(response); }
                expect(response.status.error).toEqual(false);
                expect(response.status.code).toEqual(1000);

            }

        }

        return { ...base_user, group_id, unique, user_id };

    } else {

        return { ...base_user, group_id: null, unique, user_id };

    }

};

export const delete_user = async (user_id: string) => {

    const response = await call_system_rpc(
        "system/auth",
        "user_delete",
        user_id,
    );

    if (response?.status?.error) { console.error(response); }

    expect(response.status.error).toEqual(false);
    expect(response.status.code).toEqual(1000);
    expect(response.status.message).toEqual("ok");

};

export const create_group = async (group = {}) => {

    const unique = random_hexa_chars();

    const group_name = `test_group_${unique}`;
    const description = `Test User ${unique}`;

    const base_group = {
        group_name,
        description,
        ...group
    };

    const response = await call_system_rpc(
        "system/auth",
        "groups_create_save",
        base_group,
    );

    if (response?.status?.error) { console.error(response); }

    expect(response.status.error).toEqual(false);
    expect(response.status.code).toEqual(1000);
    expect(response.status.message).toEqual("ok");
    expect(validate_uuid(response.data)).toBeTruthy;

    const group_id = response.data;

    return { ...base_group, unique, group_id, group_name };

};

export const add_user_to_group = async (user_id: string, group_id: string) => {

    const response = await call_system_rpc(
        "system/auth",
        "groups_add_user",
        { group_id, user_id },
    );

    if (response?.status?.error) { console.error(response); }

    expect(response.status.error).toEqual(false);
    expect(response.status.code).toEqual(1000);
    expect(response.status.message).toEqual("ok");

};

export const create_session = async (options = {}) => {

    const unique = random_hexa_chars();

    const base_user = {
        token: "",
        user_id: uuid(),
        language: config.i18n.default_language,
        timezone: config.i18n.default_timezone,
        fullname: `Test User ${unique}`,
        email: `test_user_${unique}@mail.com`,
        country: config.i18n.default_country,
        push_notifications_token: unique,
        ...options
    };

    const session_data = {
        user_id: base_user.user_id,
        language: base_user.language,
        timezone: base_user.timezone,
        fullname: base_user.fullname,
        email: base_user.email,
        country: base_user.country,
        push_notifications_token: base_user.push_notifications_token,
    };

    const session_timestamp = await session.create({ token: base_user.token, data: session_data, context: { request_id: uuid() }});

    return session_timestamp;

};

export const network_service_mock = ({
    url,
    method = "POST",
    path,
    reply_http_code = 200,
    reply_http_body
}: {
    url: string | RegExp,
    method: string,
    path: string,
    reply_http_code: number,
    reply_http_body: any
}) => {

    return nock(url).intercept(path, method).reply(reply_http_code, reply_http_body);

};
