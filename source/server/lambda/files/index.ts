let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import db from "../../../platform/persistence/db";
import security from "../../../platform/system/security";
import { timestamp, uuid } from "../../../platform/system/utils";
// import aws from "../../../platform/cloud/aws";
import codes from "../../../platform/codes";
import { notify_errors } from "../../../platform/system/errors/notify";

import type {
    S3Event,
    S3EventRecord
} from "aws-lambda";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const bootstrap_end_time = Date.now();

// import fs from "fs";
import path from "path";
import { ZombiExecuteContextData } from "../../types";


export const handler = async (event: S3Event): Promise<void> => {

    /* 
    https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html

    {
        "Records": [
        {
            "eventVersion": "2.0",
            "eventSource": "aws:s3",
            "awsRegion": "us-west-2",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "EXAMPLE"
            },
            "requestParameters": {
                "sourceIPAddress": "127.0.0.1"
            },
            "responseElements": {
                "x-amz-request-id": "EXAMPLE123456789",
                "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
            },
            "s3": {
                    "s3SchemaVersion": "1.0",
                    "configurationId": "testConfigRule",
                    "bucket": {
                        "name": "my-s3-bucket",
                        "ownerIdentity": {
                            "principalId": "EXAMPLE"
                        },
                        "arn": "arn:aws:s3:::example-bucket"
                    },
                    "object": {
                        "key": "HappyFace.jpg",
                        "size": 1024,
                        "eTag": "0123456789abcdef0123456789abcdef",
                        "sequencer": "0A1B2C3D4E5F678901"
                    }
                }
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

    if (!bootstrap_done) {

        bootstrap_done = true;

        log.info("Starting handler", "lambda/handler", context);

        codes.load(context);

        await cache.connect(context);

        await db.connect(context);

        await security.start(context, true);

        log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", context);

        log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", context);

    }

    const recs: S3EventRecord[] = event.Records;

    log.debug(`Processing ${recs.length} records`, "lambda/handler:files", context);

    for (const rec of recs) {

        if (rec.eventSource === "aws:s3") {

            let bucket_name = "unknown";

            try {

                bucket_name = rec?.s3?.bucket.name;

                if (bucket_name) {

                    log.debug(`Processing bucket ${bucket_name}`, "lambda/handler:files", context);

                    const file_key = rec?.s3?.object?.key;

                    if (file_key) {

                        log.debug(`Processing file ${file_key}`, "lambda/handler:files", context);

                        // const file_contents = (await aws.s3().getObject({
                        //     Bucket: bucket_name,
                        //     Key: file_key,
                        // }).promise()).Body;

                        const file_contents = "";

                        log.debug(`File size ${file_contents.length}`, "files/run", context);

                        if (bucket_name === process.env.VMD_EDF_UPLOAD_BUCKET) {

                            try {

                                if (path.extname(file_key) === ".zip") {

                                    log.debug(`File ${file_key} is a zip file`, "files/run", context);

                                } else {
                                    log.debug(`File ${file_key} is not a zip file`, "files/run", context);
                                }

                            } catch (error) {


                                log.error(error, "files/run", context);
                            }




                        } else {
                            console.error("WRONG BUCKET NAME");
                        }

                    } else {

                        log.error("No file name found on data", "lambda/handler:files", context);

                    }

                } else {

                    log.error("No bucket name found on data", "lambda/handler:files", context);

                }

            } catch (error) {

                notify_errors({
                    subject: `files > ${bucket_name}`,
                    message: error.stack || error,
                    context
                });

                log.error(error, "lambda/handler:files", context);

                throw error;

            }

        } else {

            log.error(`Unknown event source ${rec.eventSource ? rec.eventSource : ""}`, "lambda/handler:files", context);

        }

    }

};
