import config from "../../platform/config";
import { uuid } from "../../platform/system/utils";
import { network_service_mock } from "../../tests/helpers";

import  { send_message } from "./index";

const context = { request_id : uuid() };

describe("API Tests", () => {

    it("Checks return data from disabled notifications", async() => {

        const old_config = config.server.send_error_notifications = false;

        const results = await send_message(context, "Test message");

        expect(results).toEqual("disabled");

        config.server.send_error_notifications = old_config;

    });

    it("Returns invalid_url from invalid URL", async() => {

        const old_config = config.server.send_error_notifications = true;
        
        const old_config2 = process.env.ZOMBI_SLACK_WEBHOOK_URL;
        
        delete process.env.ZOMBI_SLACK_WEBHOOK_URL;
        
        const results = await send_message(context, "Test message");
        
        expect(results).toEqual("invalid_url");
        
        process.env.ZOMBI_SLACK_WEBHOOK_URL = old_config2;
        
        config.server.send_error_notifications = old_config;
    });

    it("Gets mocked data from network service", async() => {
        
        const url = process.env.ZOMBI_SLACK_WEBHOOK_URL!;

        console.log(url);

        const message = "Test message";

        network_service_mock({
            url,
            path: "",
            method: "POST",
            reply_http_code: 200,
            reply_http_body: message
        });

        const old_config = config.server.send_error_notifications = true;
        
        const results = await send_message(context, message);

        expect(results).toEqual("Test message");
        
        config.server.send_error_notifications = old_config;
    });

});


