import config from "../config";
import log from "../system/log";
import aws from "../cloud/aws";

// https://github.com/axios/axios/issues/2145#issuecomment-557135319
import axios, { AxiosRequestConfig } from "axios";

import { AxiosResponse } from "axios";

// Types
import type { ZombiAPIRPCData, ZombiHTTPClientResponse } from "./types";

import type { ZombiExecuteContextData, ZombiExecuteReturnData } from "../../server/types";

/**
 * Loopback function for the apps to call other apps
 * @param params 
 * @param params.data 
 * @param params.url 
 * @param params.request_id 
 */
export const loopback = async <T>(
    { 
        data, 
        url = config.client.endpoint, 
        context
    }: {
        data: ZombiAPIRPCData,
        url?: string,
        context: ZombiExecuteContextData
    }
): Promise<ZombiExecuteReturnData<T | null>> => {

    try {

        const response = await http<ZombiExecuteReturnData<T>>({
            method: "post",
            url, 
            data,
            headers: {
                "Content-Type": "application/json",
                "Content-Length": JSON.stringify(data).length
            }
        });

        return response.data;
        
    } catch (error) {
        
        log.error(error, "client/request", context);

        return {
            status: {
                error: true,
                message: `Client request error: ${error.message}`,
                code: 1030,
            },
            data: null,
        };
    
    }

};

/**
 * Abstraction for the HTTP client 
 */
export const http = async <T>(
    { 
        method = "post", 
        url, 
        headers = {}, 
        data = {},
        params
    }: {
        method?: string,
        url: string,
        headers?: Record<string, unknown>,
        data?: Record<string, unknown>,
        params?: { [key: string]: string } | undefined,
    }
): Promise<ZombiHTTPClientResponse<T>> => {

    const merged_headers = {
        // "Accept": "application/json",
        "Content-Type": "application/json",
        ...headers
    };

    const config: AxiosRequestConfig = {
        method,
        headers: merged_headers,
        url, 
        validateStatus: () => true,
    };

    if (params) {
        config.params = params;
    }

    if (data) {
        config.data = data;
    }

    const response: AxiosResponse = await axios(config);

    return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    } as ZombiHTTPClientResponse<T>;

};

export const queue = async (
    { 
        data, 
        queue = config.client.queue,
        request_id
    }: {
        data: ZombiAPIRPCData,
        queue?: string,
        request_id?: string
    }
): Promise<string> => {

    const rid = data?.request_id ? data.request_id : request_id ? request_id : "none";

    log.debug(`Enqueuing data for queue ${queue}`, "client/queue", { request_id: rid });

    const response = await aws.sqs.send_message(queue, JSON.stringify(data));

    if (response?.MessageId) {

        log.debug(`SQS message ID ${response.MessageId}`, "client/queue", { request_id: rid });

        return response.MessageId;

    } else {

        log.error("Unknown response from SQS", "client/queue", { request_id: rid });

        return "error";

    }

};
