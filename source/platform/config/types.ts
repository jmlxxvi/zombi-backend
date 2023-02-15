import type { ZombiLogErrorLevels } from "../system/log/types";

export type ZombiConfig = {
    db: {
        databases: {
            [key: string]: {
                uri: string,
                pool_size: number,
                enabled: boolean,
            }
        },
        default_schema: string
    },
    cache: {
        uri: string,
        fetch_size: number
    },
    i18n: {
        default_language: string,
        default_country: string,
        default_timezone: string
    },
    security: {
        system_user_id: string | undefined,
        admin_group_id: string | undefined,
        authorize_modules: boolean,
        hide_server_errors: boolean,
        server_error_message: string,
        token_size: number,
        public_modules: string[],
        cors: {
            headers: string,
            origin: string,
            methods: string
        },
        log_arguments: boolean,
        cache_key: string,
        pasword_recovery_token_life: number, // minutes
        notifications: {
            email: {
                user: string,
                pass: string,
                url: string
            }
        },
    },
    log: {
        level: ZombiLogErrorLevels,
        show_timestamp: boolean,
        show_icons: boolean,
    },
    stats: {
        enabled: boolean,
        memory_check_interval: number
    },
    session: {
        cache_prefix: string,
        expire: number // seconds
    },
    sockets: {
        ping_response_time_limit: number, // milliseconds
        reconnect_time: number, // milliseconds
        cache_prefix: string
    },
    client: {
        endpoint: string,
        queue: string
    },
    server: {
        http_port: number,
        http_ip: string,
        endpoint: string,
        timeout: number,
        send_error_notifications: boolean
    },
    firebase: {
        messaging: {
            url: string,
            server_key: string 
        }

    },
    storage: { path?: string },
    reactor: {
        enabled: boolean,
        token: string
    }

}