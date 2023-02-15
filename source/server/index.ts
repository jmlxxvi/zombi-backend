import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";

import config from "../platform/config";
import log from "../platform/system/log";
import { timestamp, uuid } from "../platform/system/utils";
import cache from "../platform/persistence/cache";
import db from "../platform/persistence/db";
import security from "../platform/system/security";
import stats from "../platform/system/stats";
import { execute } from "./execute";
import codes from "../platform/codes";

import type { ZombiExecuteHTTPHeaders, ZombiExecuteContextData } from "./types";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "512mb" }));

app.post(config.server.endpoint, async (req, res) => {

    const headers = (req.headers as ZombiExecuteHTTPHeaders);
    const params = req.body;
    const request_id: string = params.request_id ? params.request_id : uuid();
    const remote_ip = headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";

    const context: ZombiExecuteContextData = {
        request_id,
        remote_ip,
        executor_uuid,
    };

    const results = await execute(params, context);

    res.json(results);

});

app.listen(
    config.server.http_port, 
    config.server.http_ip, 
    async () => {

        const start_time: number = timestamp(true);

        const request_id = executor_uuid;

        log.always(`🔥 Starting server running on ${config.server.http_ip}:${config.server.http_port}`, "server/start", { request_id });

        codes.load({ request_id });

        await cache.connect({ request_id });
    
        await db.connect({ request_id });

        await stats.start({ request_id });
    
        await security.start({ request_id }, true);
    
        log.info(`🚀 Server started in ${Date.now() - start_time}ms`, "server/start", { request_id });
    }
);

/*

import { server, queue, websockets } from "./lambda";

import type { SQSEvent } from "aws-lambda";

import type { LambdaWebsocketsEvent } from "./lambda/types";

const appq = express();
appq.use(cors());
appq.use(compression());
appq.use(express.json());

appq.post(config.server.endpoint, async (req, res) => {

    try {

        await queue(req.body as SQSEvent);

        res.send("ok");

    } catch (error) {

        console.error(error);

        res.send(error.message);

    }

});

appq.listen(
    config.server.http_port + 1, 
    config.server.http_ip, 
    () => console.log(`Server (queue) running on ${config.server.http_ip}:${config.server.http_port + 1}`)
);

const appw = express();
appw.use(cors());
appw.use(compression());
appw.use(express.json());

appw.post(config.server.endpoint, async (req, res) => {

    try {

        await websockets(req.body as LambdaWebsocketsEvent);

        res.send("ok");

    } catch (error) {

        console.error(error);

        res.send(error.message);

    }

});

appw.listen(
    config.server.http_port + 2, 
    config.server.http_ip, 
    () => console.log(`Server (websockets) running on ${config.server.http_ip}:${config.server.http_port + 2}`)
);

Example SQS call
{
  "Records": [
    {
      "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
      "receiptHandle": "MessageReceiptHandle",
      "body": "{\"request_id\": \"3150dea7-fe0d-4957-8b55-af39a4d888ef\",\n\t\"mod\": \"system/public\",\n\t\"fun\": \"login\",\n\t\"args\": {\"username\": \"system\", \"password\": \"manager\"}\n}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1523232000000",
        "SenderId": "123456789012",
        "ApproximateFirstReceiveTimestamp": "1523232000001"
      },
      "messageAttributes": {},
      "md5OfBody": "7b270e59b47ff90a553787216d55d91d",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      "awsRegion": "us-east-1"
    },
		{
      "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
      "receiptHandle": "MessageReceiptHandle",
      "body": "{\n\t\"mod\": \"system/public\",\n\t\"fun\": \"login\",\n\t\"args\": {\"username\": \"system\", \"password\": \"manager\"}\n}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1523232000000",
        "SenderId": "123456789012",
        "ApproximateFirstReceiveTimestamp": "1523232000001"
      },
      "messageAttributes": {},
      "md5OfBody": "7b270e59b47ff90a553787216d55d91d",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      "awsRegion": "us-east-1"
    }
  ]
}
*/
