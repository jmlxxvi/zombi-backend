import config from "../../platform/config";
import log from "../../platform/system/log";

import axios from "axios";
import { ZombiExecuteContextData } from "../../server/types";

// https://api.slack.com/messaging/webhooks
const send_message = async (context: ZombiExecuteContextData, message: string): Promise<string> => {

    if (config.server.send_error_notifications) {

        const url = process.env.ZOMBI_SLACK_WEBHOOK_URL;
        
        if (url) {
    
            log.info("Sending Slack message", "slack/send_message", context);
    
            const headers = { "Content-Type": "application/json" };
        
            // TODO maybe we could use client.http() here
            const response = await axios.post(
                url, 
                { "text": message },
                { headers, validateStatus: () => true }
            );
    
            log.info(`Slack message sent, returned: ${response.data}`, "slack/send_message", context);
    
            return response.data;
    
        } else {
    
            log.error("Slack URL not found, check config", "slack/send_message", context);
    
            return "invalid_url";
    
        }


    } else {

        log.info("Slack notifications disabled", "slack/send_message", context);

        return "disabled";

    }

};

export {
    send_message
};