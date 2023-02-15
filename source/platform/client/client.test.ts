import config from "../config";

import aws from "../cloud/aws";
jest.mock("../cloud/aws");

import { loopback, queue } from ".";

import { network_service_mock } from "../../tests/helpers";
import { uuid } from "../system/utils";

const request_id = uuid();

describe("CLIENT Tests", () => {

    it("Responds with loopback error on bad url", async () => {
        const response = await loopback({
            data: {
                mod: "system/public",
                fun: "ping",
                args: "non_relevant"
            },
            url: "http://127.0.0.1:65000/server",
            context: { request_id: "test" }
        });

        expect(response.status.error).toEqual(true);
        expect(response.status.code).toEqual(1030);
        expect(response.status.message).toEqual(expect.any(String));
        expect(response.status.message).toEqual("Client request error: connect ECONNREFUSED 127.0.0.1:65000");

    });

    it("Responds with mocked loopback response", async () => {

        network_service_mock({
            url: config.client.endpoint,
            path: "",
            method: "POST",
            reply_http_code: 200,
            reply_http_body: {
                "status": {
                    "timestamp": 1674590799794,
                    "elapsed": 612,
                    "request_id": "bfb098c5-6208-465a-988c-4f37244eef7a",
                    "executor": "d4592fb7-87e3-41de-8d41-e7073129a68b",
                    "error": false,
                    "code": 1000,
                    "message": "ok"
                },
                "data": [],
                "origin": "test/test"
            }
        });

        const response = await loopback({
            data: {
                mod: "system/public",
                fun: "ping",
                args: "non_relevant"
            },
            url: config.client.endpoint,
            context: { request_id: "test" }
        });

        expect(response.status.code).toEqual(1000);
        expect(response.status.error).toEqual(false);
        expect(response.status.message).toEqual(expect.any(String));
        expect(response.status.message).toEqual("ok");

    });

    it("Responds with queue and MessageId", async () => {

        (aws.sqs.send_message as any).mockResolvedValue({
            MessageId: "12345"
        });

        const response = await queue({ 
            data: {
                "token": "{{token}}",
                "mod": "sandbox/bucket",
                "fun": "ohno",
                "args": "America/Argentina/Salta"
            }, 
            queue: "test_queue",
            request_id
        });

        expect(response).toEqual("12345");

    });

    it("Responds with queue without MessageId", async () => {

        (aws.sqs.send_message as any).mockResolvedValue({});

        const response = await queue({ 
            data: {
                "token": "{{token}}",
                "mod": "sandbox/bucket",
                "fun": "ohno",
                "args": "America/Argentina/Salta"
            }, 
            queue: "test_queue",
            request_id
        });

        expect(response).toEqual("error");

    });

});


