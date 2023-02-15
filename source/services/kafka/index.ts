import log from "../../platform/system/log";

import { Kafka } from "kafkajs";

import fs from "fs";
import { ZombiExecuteContextData } from "../../server/types";

let connected = false;
let producer: any = null;

const brokers = process.env.APP_EVENTS_KAFKA_BROKERS || "";

/**
 * Connects to the Kafka broker(s) on first send() call.
 * @param {string=} request_id - The transaction request ID
 * @returns Promise{void}
 */
const _connect = async (context: ZombiExecuteContextData) => {

    if (!connected) {

        const kafka = new Kafka({
            brokers: brokers.split(","),
            retry: {
                initialRetryTime: 100,
                retries: 8
            },
            ssl: {
                rejectUnauthorized: false,
                ca: [fs.readFileSync(__dirname + "/certs/ca.crt", "utf-8")], // TODO make this async
                key: fs.readFileSync(__dirname + "/certs/key.pem", "utf-8"),
                cert: fs.readFileSync(__dirname + "/certs/cert.pem", "utf-8"),
                passphrase: process.env.APP_EVENTS_KAFKA_PASSPHRASE
            },
        });

        producer = kafka.producer();

        await producer.connect();

        log.debug(`Conected to Kafka brokers ${brokers}`, "kafka/connect", context);

        connected = true;
    }
};



/**
 * Sends a message string or array of strings to the topic indicated to Kafka brokers
 * @param params
 * @param params.topic - The topic to send the message(s) to 
 * @param params.messages - The message(s) to send
 * @param params.request_id - The request ID to use with log()
 */
const send = async ({ topic, messages, context }: { topic: string, messages: string[] | string, context: ZombiExecuteContextData }): Promise<void> => {
    if(process.env.NODE_ENV !== "local"){
        const mess = Array.isArray(messages) ? messages.map(message => ({ value: message })) : [{ value: messages }];
        await _connect(context);

        return producer.send({
            topic: topic,
            messages: mess
        }).then((result: any) => {
            log.debug(JSON.stringify(result), "pepa/platform/kafka-send", context);
        }).catch((error: any) => {
            log.error(JSON.stringify(error), "pepa/platform/kafka-send", context);
        });
            
    }
};

/**
 * Disconnects from Kafka brokers
 * @param request_id - The transaction request ID
 */
const disconnect = async (context: ZombiExecuteContextData) => {

    log.debug(`Disconnected from Kafka brokers ${brokers}`, "kafka/disconnect", context);

    return producer.disconnect();

};

export {
    send,
    disconnect
};