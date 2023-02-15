import AWS from "aws-sdk";
import https from "https";

// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html
const agent = new https.Agent({
    keepAlive: true, 
    // Infinity is read as 50 sockets
    maxSockets: Infinity
});

AWS.config.update({
    httpOptions: { agent },
    region: process.env.AWS_DEFAULT_REGION
});

const _create_ws_message = (domain_name: string, stage: string) => {

    const endpoint = `${domain_name}/${stage}`; //  https://8ge20yn1zj.execute-api.us-east-1.amazonaws.com/dev/@connections

    return new AWS.ApiGatewayManagementApi({
        apiVersion: "2018-11-29",
        endpoint,
    });
};

const send_ws_message = async ({ domain_name, stage, connection_id, message }: { domain_name: string, stage: string, connection_id: string, message: string }) => {

    const ws = _create_ws_message(domain_name, stage);

    const postParams = {
        Data: message,
        ConnectionId: connection_id,
    };

    return ws.postToConnection(postParams).promise();
};

const dynamodb = () => {

    return new AWS.DynamoDB.DocumentClient();

};

const sns = {

    async publish(topic: string, message: string) {

        const params = {
            Message: message,
            TopicArn: `arn:aws:sns:${AWS.config.region}:${process.env.AWS_DEFAULT_ACCOUNT}:${topic}`
        };

        return new AWS.SNS({apiVersion: "2010-03-31"}).publish(params).promise();
    }
};

const sqs = {

    /*
    Notes on IAM policies needed:

    https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-api-permissions-reference.html
    Resource is "arn:aws:sqs:<REDGION>:<ACCOUNT>:<QUEUE>", * are permitted on account and queue name.

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "sqs:ReceiveMessage",
                    "sqs:SendMessage",
                    "sqs:DeleteMessage",
                    "sqs:PurgeQueue",
                    "sqs:ListQueues",
                    "sqs:GetQueueAttributes",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:sqs:us-east-1:*:*"
            }
        ]
    }

    Also a VPC endpoint may be needed is the lambda cannot access SQS over Internet: https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-endpoints.html
    */

    async send_message(queue: string, message: string) {

        const params = {
            MessageBody: message,
            QueueUrl: `https://sqs.${AWS.config.region}.amazonaws.com/${process.env.AWS_DEFAULT_ACCOUNT}/${queue}`
        };

        return new AWS.SQS({apiVersion: "2012-11-05"}).sendMessage(params).promise();
    }
    
};

const s3 = (): any => (new AWS.S3({ apiVersion: "2006-03-01" }));

const ses = (): any => (new AWS.SES({ apiVersion: "2006-03-01" }));

export default {
    dynamodb,
    send_ws_message,
    sns,
    sqs,
    s3,
    ses
};
