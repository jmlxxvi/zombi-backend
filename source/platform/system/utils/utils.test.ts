// import config from "../../../platform/config";

import { validate_uuid } from "./validators";
import { date_format, pad, string_end } from ".";

describe("API Tests", () => {

    it("Detects valid UUID", async () => {

        const valid_uuid = "98a82e34-4adb-4d16-9697-dce314709a11";

        const results = validate_uuid(valid_uuid);

        expect(results.message).toEqual("ok");
        expect(results.valid).toEqual(true);

    });

    it("Detects invalid UUID", async () => {

        const invalid_uuid = "x8a82e34-4adb-4d16-9697-dce314709a11";

        const results = validate_uuid(invalid_uuid);

        expect(results.message).toEqual("Invalid UUID");
        expect(results.valid).toEqual(false);

    });


    it("Gets valid Date format in UTC", async () => {

        const format = "%Y%m%d%H%M%S%x";
        const use_utc = true;
        const date = new Date("2011-04-11T10:20:30.999Z");

        const results = date_format(date, format, use_utc);

        expect(results).toEqual("20110411102030999");

    });

    it("Gets valid Date format not in UTC", async () => {

        const format = "%Y%m%d%H%M%S%x";
        const date = new Date("2011-04-11T10:20:30.999");

        const results = date_format(date, format);

        expect(results).toEqual("20110411102030999");

    });

    it("Gets valid Date format with unknown format code %W", async () => {

        const format = "%Y%m%d%H%M%W";
        const use_utc = true;
        const date = new Date("2011-04-11T10:20:30Z");

        const results = date_format(date, format, use_utc);

        expect(results).toEqual("201104111020%W");

    });

    it("Gets valid long string end", async () => {

        const s = "65E8097F66024F54AE8F1982D5E762E6B9EE4375069205205C77E3CF8737829B4D248";

        const results = string_end(s);

        expect(results).toEqual("...29B4D248");

    });

    it("Gets valid short string end", async () => {

        const s = "248";

        const results = string_end(s);

        expect(results).toEqual("...248");

    });

    it("Gets invalid string end", async () => {

        const results = string_end(undefined);

        expect(results).toEqual("<invalid_string>");

    });

    // pad = (value: number, length = 10, padding_char = "0")

    it("Gets padded data with default 0s", async () => {

        const results = pad(99, 4);

        expect(results).toEqual("0099");

    });

    it("Gets padded data with -", async () => {

        const results = pad(99, 4, "-");

        expect(results).toEqual("--99");

    });

    it("Gets padded data with all defaults", async () => {

        const results = pad(99);

        expect(results).toEqual("0000000099");

    });

});
