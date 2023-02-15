import config from "../platform/config";
import { uuid } from "../platform/system/utils";
import { execute } from "../server/execute";
import { ZombiExecuteContextData, ZombiExecuteReturnData } from "../server/types";

export type TestClientReturnType = {
    login: (params?: any) => Promise<any>,
    logoff: () => void,
    call: (mod: string, fun: string, args?: any, token?: string) => any,
    set_token: (token: string | null) => string | null,
    get_token: () => string | null,
}

export function Test_rpc_client() {

    const executor_uuid = uuid();
    const remote_ip = "127.0.0.1";

    let _token: string | null = null;

    async function call(mod: string, fun: string, args?: any, token?: string): Promise<ZombiExecuteReturnData<any>> {

        const request_id = uuid();

        const params: {
            mod: string,
            fun: string,
            args?: any,
            token?: string
        } = {
            mod,
            fun,
        };
    
        if (args) {
            params.args = args;
        }

        if (_token) {
            params.token = _token;
        }
    
        if (token) {
            params.token = token;
        }
    
        const context: ZombiExecuteContextData = {
            request_id,
            remote_ip,
            executor_uuid,
        };
    
        const response = await execute(params, context);

        return response;

    }

    async function login(params?: any) {

        const username = params?.username ?? process.env.ZOMBI_TEST_USER_NAME;
        const password = params?.password ?? process.env.ZOMBI_TEST_USER_PASSWORD;
    
        const response = await call(
            "system/public",
            "login",
            { username, password }
        );
    
        if (response?.status?.error) { console.error(response); }
    
        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.token.length).toEqual(config.security.token_size * 2);
    
        _token = response.data.token;
    
        return { token: _token };
    
    }

    async function logoff() {
    
        const response = await call(
            "system/public",
            "logoff",
        );

        if (response?.status?.error) { console.error(response); }

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
    
    }

    return {
        login,
        logoff,
        call,
        set_token(token: string | null): string | null { return _token = token; },
        get_token(): string | null { return _token; },
    } as TestClientReturnType;

}