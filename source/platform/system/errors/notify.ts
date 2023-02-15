import log from "../log";
import { send_message } from "../../../services/slack";
import { ZombiExecuteContextData } from "../../../server/types";

export const notify_errors = async ({ subject, message, context }: { subject: string, message: string, context?: ZombiExecuteContextData }): Promise<boolean> => {

    const uuid = log.get_uuid();

    const rid = context?.request_id ? context.request_id : uuid;
    const eid = context?.executor_uuid ? context?.executor_uuid : uuid;

    try {

        const date = new Date().toISOString();

        await send_message({ request_id: rid }, `Date: ${date}\nContext [${process.env.ZOMBI_CONTEXT}]: ${subject}\nLambda ID: ${eid}\nRequest ID: ${rid}\nStack:\n${message}`);

        return true;

    } catch (error) {

        log.error(error, "server/notify_errors", context);

        return false;
        
    }

};
