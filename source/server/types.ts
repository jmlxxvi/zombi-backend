// export interface ZombiExecuteDataHeaders {
//     [key: string]: string | undefined
// }

export type ZombiExecuteData = {
    mod: string, 
    fun: string, 
    args: any, 
    context: ZombiExecuteContextData,
}

// export type ZombiExecuteContextData = {
//     token: string, 
//     headers: string[], 
//     request_id: string,
// }

export interface ZombiExecuteHTTPHeaders {
    [name: string]: string | undefined;
}

export interface ZombiAPIReturnData<T> {
    error: boolean,
    code?: number,
    message?: string,
    data: T,
}

export type ZombiExecuteReturnStatus = {
    error: boolean,
    code: number,
    message?: string,
    timestamp?: number,
    elapsed?: number,
    request_id?: string,
    executor?: string,
}

export type ZombiExecuteReturnData<T> = {
    origin?: string,
    status: ZombiExecuteReturnStatus,
    data: T
}

export type ZombiExecuteContextData = {
    request_id: string,
    token?: string,
    user_id?: string,
    headers?: ZombiExecuteHTTPHeaders,
    remote_ip?: string,
    user_name?: string,
    executor_uuid?: string,
}

export type ZombiExecuteReturnSchema = {
    title: string,
    type: string,
}