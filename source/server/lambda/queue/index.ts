let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import { execute } from "../../execute";
import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import db from "../../../platform/persistence/db";
import security from "../../../platform/system/security";
import { timestamp, uuid } from "../../../platform/system/utils";
import codes from "../../../platform/codes";

import type {
    SQSEvent,
    SQSRecord,
} from "aws-lambda";
import { ZombiExecuteContextData } from "../../types";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const bootstrap_end_time = Date.now();

export const handler = async (event: SQSEvent): Promise<void> => {

    /* 
    https://docs.aws.amazon.com/lambda/latest/dg/with-sqs-example.html
    If the handler returns normally without exceptions, Lambda considers the message processed successfully and begins reading new messages in the queue. 
    Once a message is processed successfully, it is automatically deleted from the queue. 
    If the handler throws an exception, Lambda considers the input of messages as not processed and invokes the function with the same batch of messages. 
    */

    /*
    {
        "Records": [
            {
            "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
            "receiptHandle": "MessageReceiptHandle",
            "body": "Hello from SQS!",
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

    const start_time: number = timestamp(true);

    const context: ZombiExecuteContextData = {
        token: "none",
        request_id: uuid(),
        executor_uuid
    };

    const recs: SQSRecord[] = event.Records;

    log.debug(`Processing ${recs.length} records`, "lambda/handler:queue", context);

    for (const rec of recs) {

        let request_id_changed = false, original_request_id: string = context.request_id;

        if (rec.eventSource === "aws:sqs") {

            log.debug(`Processing message ID ${rec.messageId}`, "lambda/handler:queue", context);

            try {

                const params = JSON.parse(rec.body);

                // If there is a request_id on the record, we use it 
                // and then we go back to the original request_id
                if (params.request_id) {

                    request_id_changed = true;

                    original_request_id = context.request_id;

                    context.request_id = params.request_id;

                }

                if (!bootstrap_done) {

                    bootstrap_done = true;

                    log.info("Starting handler", "lambda/handler:queue", context);

                    codes.load(context);

                    await cache.connect(context);

                    await db.connect(context);

                    await security.start(context, true);

                    log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler:queue", context);

                    log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler:queue", context);

                }

                const response = await execute(params, context);

                log.trace(`Queue response: ${JSON.stringify({ status: response.status, origin: response.origin })}`, "lambda/handler:queue", context);

            } catch (error) {

                log.error(error, "lambda/handler:queue", context);

                throw error;

            } finally {

                if (request_id_changed) {

                    request_id_changed = false;

                    context.request_id = original_request_id;

                }

            }

        } else {

            log.error(`Unknown event source ${rec.eventSource ? rec.eventSource : ""}`, "lambda/handler:queue", context);

        }

    }

};