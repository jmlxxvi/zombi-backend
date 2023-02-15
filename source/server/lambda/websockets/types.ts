export type LambdaWebsocketsEvent = {
    queryStringParameters: {
        [key: string]: any
    },
    requestContext: {
        routeKey: string,
        stage: string,
        domainName: string,
        connectionId: string,
        apiId: string
    },
    body?: string
}