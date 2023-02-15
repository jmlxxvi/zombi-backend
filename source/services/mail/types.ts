export type ZombiMailSend = {
    from: string,
    to: string,
    subject: string,
    body: string
};

export type ZombiMailSendSNS = {
    Destination: {
        ToAddresses: string[],
        CcAddresses?: string[]
    },
    Message: {
        Body: {
            Html: { 
                Charset?: string, 
                Data: string 
            }
        },
        Subject: {
            Charset?: string,
            Data: string
        }
    },
    Source?: string
};

