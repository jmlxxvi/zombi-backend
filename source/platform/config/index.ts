import { yes_or_not } from "../system/utils";

import type { ZombiLogErrorLevels } from "../system/log/types";
import type { ZombiConfig } from "./types";

const config: ZombiConfig = {

    db: {
        databases: {
            default: {
                uri: process.env.ZOMBI_DB_URL ?? "",
                pool_size: parseInt(process.env.ZOMBI_DB_POOL_SIZE || "2"),
                enabled: yes_or_not(process.env.ZOMBI_DB_ENABLED),
            },
            secondary: {
                uri: process.env.ZOMBI_DB_2_URI ?? "",
                pool_size: parseInt(process.env.ZOMBI_DB_POOL_SIZE_2 || "2"),
                enabled: yes_or_not(process.env.ZOMBI_DB_ENABLED_2),
            }
        },
        default_schema: process.env.ZOMBI_DB_DEFAULT_SCHEMA || "public"
    },
    cache: {
        uri: process.env.ZOMBI_CACHE_URL || "redis://localhost:6379",
        fetch_size: 100
    },

    i18n: {
        default_language: "es",
        default_country: "AR",
        default_timezone: "America/Argentina/Buenos_Aires"
    },

    security: {
        system_user_id: process.env.ZOMBI_SYSTEM_USER_ID,
        admin_group_id: process.env.ZOMBI_ADMIN_GROUP_ID,
        authorize_modules: yes_or_not(process.env.ZOMBI_AUTH_MODULE_ACCESS),
        hide_server_errors: yes_or_not(process.env.ZOMBI_HIDE_SERVER_ERRORS),
        server_error_message: "Server Error",
        token_size: 64,
        public_modules: ["system/public", "mobile/public", "health_gorilla/public", "builder/buildings", "viemed/public"],
        cors: {
            headers: "*",
            origin: "*",
            methods: "*"
        },
        log_arguments: yes_or_not(process.env.ZOMBI_LOG_ARGUMENTS),
        cache_key: "ZOMBI_AUTH_MODULE",
        pasword_recovery_token_life: 60, // minutes
        notifications: {
            email: {
                user: process.env.ZOMBI_NOTIFICATIONS_EMAIL_USER || "no_user",
                pass: process.env.ZOMBI_NOTIFICATIONS_EMAIL_PASS || "no_password",
                url: process.env.ZOMBI_NOTIFICATIONS_EMAIL_URL || "no_url"
            }
        },
    },

    log: {
        level: (process.env.ZOMBI_LOG_LEVEL ?? "DEBUG") as ZombiLogErrorLevels, // DISABLED, FATAL, ERROR, WARN, INFO, DEBUG, TRACE
        show_timestamp: yes_or_not(process.env.ZOMBI_LOG_SHOW_TIMESTAMP),
        show_icons: yes_or_not(process.env.ZOMBI_LOG_SHOW_ICONS),
    },

    stats: {
        enabled: yes_or_not(process.env.ZOMBI_STATS_ENABLED),
        memory_check_interval: parseInt(process.env.ZOMBI_STATS_MEMORY_CHECK_INTERVAL || "60") // seconds
    },

    session: {
        cache_prefix: "ZOMBI_SESSION",
        expire: 1800 // seconds
    },

    sockets: {
        ping_response_time_limit: 2000, // milliseconds
        reconnect_time: 2000, // milliseconds
        cache_prefix: "ZOMBI_WEBSOCKETS"
    },

    client: {
        endpoint: process.env.ZOMBI_CLIENT_ENDPOINT || "http://localhost:8000/server",
        queue: process.env.ZOMBI_CLIENT_QUEUE || "lambda-queue-dev"
    },

    server: {
        http_port: 8000,
        http_ip: "0.0.0.0",
        endpoint: process.env.ZOMBI_SERVER_ENDPOINT || "/server",
        timeout: parseInt(process.env.ZOMBI_SERVER_TIMEOUT || "10000"),
        send_error_notifications: yes_or_not(process.env.ZOMBI_SERVER_SEND_ERROR_NOTIFICATIONS)
    },

    firebase: {
        messaging: {
            url: process.env.ZOMBI_FIREBASE_MESSAGING_URL || "no_url",
            server_key: process.env.ZOMBI_FIREBASE_MESSAGING_KEY || "no_key"
        }

    },
    reactor: {
        enabled: yes_or_not(process.env.ZOMBI_AUTH_REACTOR_ENABLED),
        token: process.env.ZOMBI_AUTH_REACTOR_TOKEN || ""
    },

    storage: { path: process.env.ZOMBI_STORAGE_PATH }

};

export default config;