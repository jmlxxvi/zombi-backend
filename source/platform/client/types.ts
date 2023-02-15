export type ZombiAPIRPCData = {
    mod: string, 
    fun: string, 
    args?: any, 
    token?: string, 
    request_id?: string
}

export type ZombiHTTPClientResponse<T> = {
    data: T,
    status: number,
    statusText: string,
    headers: Record<string, string>,
}