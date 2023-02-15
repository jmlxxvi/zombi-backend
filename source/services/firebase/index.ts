import config from "../../platform/config";
import log from "../../platform/system/log";
import session from "../../platform/system/session";
import { http } from "../../platform/client";
import { string_end } from "../../platform/system/utils";

import type { MessagingPayload, MessagingOptions } from "./types";
import { ZombiExecuteContextData } from "../../server/types";
// import type { ZombiExecuteReturnData } from "../../../server/types";

const get_firebase_info = async (firebase_token: string, _request_id: string) => {

    const response = await http<Record<string, unknown>>({
        url: "https://iid.googleapis.com/iid/info/" + firebase_token,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${config.firebase.messaging.server_key}`
        }
    });

    return response;

    /*
        Examples of returned data:
        {
            "applicationVersion": "58",
            "application": "ar.com.personalpay.dev",
            "scope": "*",
            "authorizedEntity": "315220445706",
            "appSigner": "08c30658df0557b47ed32fb3e33589ec935c9b38",
            "platform": "ANDROID"
        }

        {
            "error": "InvalidToken"
        }

        {
            "error": "No information found about this instance id."
        }
    */

};

type ZombiFirebaseNotificationResponse = {
    multicast_id: number,
    success: number,
    failure: number,
    canonical_ids: number,
    results: any[]
  }

const send_push_notification = async (payload: MessagingPayload, _request_id: ZombiExecuteContextData) => {

    try {

        const response = await http<ZombiFirebaseNotificationResponse>({
            url: config.firebase.messaging.url,
            data: payload as Record<string, unknown>,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${config.firebase.messaging.server_key}`
            }
        });

        const { success, failure, results } = response.data;
    
        return {
            success,
            failure,
            results,
            message: "ok"
        };

    } catch (error) {

        return {
            success: 0,
            failure: 1,
            results: [],
            message: error.message
        };

    }

    /*
        Examples of returned data:

        {
            "multicast_id": 7713582486080297000,
            "success": 1,
            "failure": 0,
            "canonical_ids": 0,
            "results": [
                {
                    "message_id": "0:1617243013832792%48d5a7e5f9fd7ecd"
                }
            ]
        }

        {
            "multicast_id": 1276918931788505300,
            "success": 0,
            "failure": 1,
            "canonical_ids": 0,
            "results": [
                {
                    "error": "NotRegistered"
                }
            ]
        }

        {
            "multicast_id": 8119462418403615000,
            "success": 0,
            "failure": 1,
            "canonical_ids": 0,
            "results": [
                {
                    "error": "MismatchSenderId"
                }
            ]
        }
    */
    
};

const send_firebase_message_to_session_token = async ({
    token,
    payload, 
    options = {}, 
    context
}: { 
    token: string, 
    payload: MessagingPayload, 
    options: MessagingOptions, 
    context: ZombiExecuteContextData
}) => {

    const firebase_token = await session.get(token, "push_notifications_token");

    if (firebase_token) {

        log.debug(`Sending message to Firebase token ${string_end(firebase_token)} for session token ${string_end(token)}`, "firebase/send_firebase_message_to_session_token", context);

        return send_message_to_firebase_token({ firebase_token, payload, options, context });

    } else {

        log.debug(`Firebase token not found for session token ${string_end(token)}`, "firebase/send_firebase_message_to_session_token", context);

        return null; 

    }

};

const send_message_to_firebase_token = async ({
    firebase_token, payload, options = {}, context
}: {
    firebase_token: string, payload: MessagingPayload, options?: MessagingOptions, context: ZombiExecuteContextData
}) => { // eslint-disable-line

    // This is the secret of cloud messaging… — 
    // “When the payload of the message does not contain notification parameter, 
    // everything is captured by the onMessageReceived() method in all application states”
    //
    // To create a notification on the mobile app send both notification_title and notification_text data parameters
    // If you omit them, only the data is sent to the app
    payload.to = firebase_token;

    const extended_payload = {...payload, ...options};

    const response = await send_push_notification(extended_payload, context);

    log.debug(`Firebase response ${JSON.stringify(response)}`, "firebase/send_message_to_firebase_token", context);
    
    return response;

};

export {
    send_firebase_message_to_session_token,
    send_message_to_firebase_token,
    get_firebase_info
};