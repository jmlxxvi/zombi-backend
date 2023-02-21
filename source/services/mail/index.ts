import config from "../../platform/config";
import log from "../../platform/system/log";
// import aws from "../../platform/cloud/aws";

import nodemailer from "nodemailer";

import type { ZombiMailSendSNS, ZombiMailSend } from "./types";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.security.notifications.email.user,
        pass: config.security.notifications.email.pass
    }
});

export const send = async ({
    from,
    to,
    subject,
    body
}: ZombiMailSend): Promise<boolean> => {

    try {

        log.debug(`Sending message to ${to}`, "mail/send");

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text: "HTML content not supported",
            html: body
        });

        log.debug(`Message sent with id ${info.messageId}`, "mail/send");

        return true;

    } catch (error) {

        log.error(error, "mail/send");

        return false;

    }

};



export const send_sns = async (email_params: ZombiMailSendSNS) => {

    try {

        if (!email_params.Message.Body.Html.Charset) {
            email_params.Message.Body.Html.Charset = "UTF-8";
        }

        if (!email_params.Message.Subject.Charset) {
            email_params.Message.Subject.Charset = "UTF-8";
        }

        // await aws.ses().sendEmail(email_params).promise();

    } catch (error) {

        log.error(error, "mail/send_sns");

    }

};

// Example of SES with Nodemailer

/* 
let nodemailer = require("nodemailer");
let aws = require("@aws-sdk/client-ses");

// configure AWS SDK
process.env.AWS_ACCESS_KEY_ID = "....";
process.env.AWS_SECRET_ACCESS_KEY = "....";
const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: "us-east-1",
});

// create Nodemailer SES transporter
let transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

// send some mail
transporter.sendMail(
  {
    from: "sender@example.com",
    to: "recipient@example.com",
    subject: "Message",
    text: "I hope this message gets sent!",
    ses: {
      // optional extra arguments for SendRawEmail
      Tags: [
        {
          Name: "tag_name",
          Value: "tag_value",
        },
      ],
    },
  },
  (err, info) => {
    console.log(info.envelope);
    console.log(info.messageId);
  }
);

*/