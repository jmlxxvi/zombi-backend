import { Runtime } from 'aws-cdk-lib/aws-lambda';

const appId = process.env.APP_ID || "zombi";
const context = process.env.APP_CONTEXT || "dev";

function prefix(name: string): string {
    return `${appId}-${context}-${name}`
}

const config = {
    context,
    s3: {
        code: {
            name: prefix("code-bucket"),
        },
        docs: {
            name: prefix("docs-bucket"),
        }
    },
    vpc: {
        name: prefix("vpc"),
    },
    key: {
        name: process.env.KEYPAIR_NAME!,
        file: `${process.env.KEYPAIR_NAME!}.pem`,
    },
    ec2: {
        bastion: {
            name: prefix("bastion"),
        }
    },
    redis: {
        name: prefix("cache"),
        port: 6379
    },
    rds: {
        name: prefix("db"),
        username: "zombi",
        password: process.env.DB_PASSWORD!,
        port: 5432,
        database: "zombi",
    },
    lambdas: {
        settings: {
            runtime: Runtime.NODEJS_18_X,
            inlineCode: `export const handler = async (event, context) => {
                            console.log({ event, context });
                            const response = {
                                statusCode: 200,
                                body: JSON.stringify({ event, context }),
                            };
                            return response;
                        };`
        },
        server: {
            name: prefix("server-lambda"),
            memorySize: 1024,
            timeout: 30,
            handler: "server/lambda/base.handler",
        },
        queue: {
            name: prefix("queue-lambda"),
            memorySize: 1024,
            timeout: 30,
            handler: "server/lambda/queue.handler",
        },
        reactor: {
            name: prefix("reactor-lambda"),
            memorySize: 1024,
            timeout: 30,
            handler: "server/lambda/reactor.handler",
            token: process.env.REACTOR_TOKEN!,
        },
        websockets: {
            name: prefix("websockets-lambda"),
            memorySize: 128,
            timeout: 30,
            handler: "server/lambda/websockets.handler",
        },
        files: {
            name: prefix("files-lambda"),
            memorySize: 1024,
            timeout: 30,
            handler: "server/lambda/files.handler",
        }
    },
    ci: {
        userName: prefix("ci-user"),
        accessKey: prefix("ci-ak"),
    }
}

export default config;

const baseConfig = {
    NODE_ENV: process.env.NODE_ENV || "production",
    ZOMBI_CONTEXT: config.context,
    ZOMBI_DB_URL: "",
    ZOMBI_DB_DEFAULT_SCHEMA: "app_sys",
    ZOMBI_CACHE_URL: "",
    ZOMBI_LOG_LEVEL: "TRACE",
    ZOMBI_LOG_SHOW_TIMESTAMP: "yes",
    ZOMBI_LOG_SHOW_ICONS: "yes",
}

export const serverConfig = {
    ...baseConfig,
    ZOMBI_SERVER_TIMEOUT: "30000",
    ZOMBI_SERVER_SEND_ERROR_NOTIFICATIONS: "no",
    ZOMBI_SERVER_MAX_MEMORY_ALARM: "80",
    ZOMBI_STORAGE_PATH: "/tmp",
    ZOMBI_STATS_ENABLED: "yes",
    ZOMBI_STATS_MEMORY_CHECK_INTERVAL: "300",
    ZOMBI_AUTH_MODULE_ACCESS: "yes",
    ZOMBI_HIDE_SERVER_ERRORS: "no",

}

export const queueConfig = {
    ...baseConfig,
}

export const reactorConfig = {
    ...baseConfig,
    ZOMBI_AUTH_REACTOR_TOKEN: process.env.REACTOR_TOKEN!,
    ZOMBI_AUTH_REACTOR_ENABLED: "yes"
}

export const websocketsConfig = {
    ...baseConfig,
}

export const filesConfig = {
    ...baseConfig,
}
