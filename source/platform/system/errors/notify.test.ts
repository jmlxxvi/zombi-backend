// import config from "../../../platform/config";
import { uuid } from "../utils";

import { notify_errors } from "./notify";

import { send_message } from "../../../services/slack";
jest.mock("../../../services/slack");

const context = { request_id: uuid() };

describe("API Tests", () => {

    it("Checks return exception from notify_errors()", async () => {

        (send_message as any).mockImplementation(() => {
            throw new Error("Notify error");
        });

        const results = await notify_errors({ subject: "Test subject", message: "Test message", context });

        expect(results).toEqual(false);

    });

    it("Checks return exception from notify_errors() without context", async () => {

        (send_message as any).mockImplementation(() => {
            throw new Error("Notify error");
        });

        const results = await notify_errors({ subject: "Test subject", message: "Test message" });

        expect(results).toEqual(false);

    });
});


