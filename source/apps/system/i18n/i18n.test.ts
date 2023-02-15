// import config from "../../../../../platform/config";
import db from "../../../platform/persistence/db";
import cache from "../../../platform/persistence/cache";
import { uuid } from "../../../platform/system/utils";
import { create_user, network_service_mock } from "../../../tests/helpers";
import { Test_rpc_client } from "../../../tests/client";

const context = { request_id : uuid() };

const global_rpc_client = Test_rpc_client();

const time_service_url = "https://worldtimeapi.org/api/timezone";

beforeAll(async () => {

    await cache.connect(context);
    await db.connect(context);

    const { username, password } = await create_user({}, { is_admin: true });

    await global_rpc_client.login({
        username, password
    });

});

afterAll(async () => {

    await cache.disconnect();
    await db.disconnect(context);

});

describe("API Tests", () => {

    it("Checks languages()", async() => {

        const response = await global_rpc_client.call(
            "system/i18n",
            "languages"
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.length).toEqual(11);

    });

    it("Checks countries()", async() => {

        const response = await global_rpc_client.call(
            "system/i18n",
            "countries"
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.length).toEqual(252);

    });

    it("Checks timezones() with no filter", async() => {

        const response = await global_rpc_client.call(
            "system/i18n",
            "timezones"
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.length).toEqual(425);

    });

    it("Checks timezones() filtering by country", async() => {

        const response = await global_rpc_client.call(
            "system/i18n",
            "timezones",
            { country: "AR" }
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.length).toEqual(12);

    });

    // it("Checks timezone_data() with mocked service data", async() => {

    //     (timezone_service_data as any).mockResolvedValue({
    //         "abbreviation": "-03",
    //         "client_ip": "190.16.105.200",
    //         "datetime": "2022-12-29T13:08:24.663922-03:00",
    //         "day_of_week": 4,
    //         "day_of_year": 363,
    //         "dst": false,
    //         "dst_from": null,
    //         "dst_offset": 0,
    //         "dst_until": null,
    //         "raw_offset": -10800,
    //         "timezone": "America/Argentina/Ushuaia",
    //         "unixtime": 1672330104,
    //         "utc_datetime": "2022-12-29T16:08:24.663922+00:00",
    //         "utc_offset": "-03:00",
    //         "week_number": 52
    //     });

    //     const { token } = await exec_login();

    //     const response = await global_rpc_client.call(
    //         "system/i18n",
    //         "timezone_data",
    //         "the_timezone_is_mocked"
    //     );

    //     expect(response.status.error).toEqual(false);
    //     expect(response.status.code).toEqual(1000);
    //     expect(response.data.timezone).toEqual("America/Argentina/Ushuaia");

    // });

    it("Checks timezone_data() with intercepted service data", async() => {

        const timezone = "America/Argentina/Ushuaia";

        network_service_mock({
            url: time_service_url,
            path: `/${timezone}`,
            method: "GET",
            reply_http_code: 200,
            reply_http_body: {
                "abbreviation": "-03",
                "client_ip": "190.16.105.200",
                "datetime": "2022-12-29T13:08:24.663922-03:00",
                "day_of_week": 4,
                "day_of_year": 363,
                "dst": false,
                "dst_from": null,
                "dst_offset": 0,
                "dst_until": null,
                "raw_offset": -10800,
                "timezone": timezone,
                "unixtime": 1672330104,
                "utc_datetime": "2022-12-29T16:08:24.663922+00:00",
                "utc_offset": "-03:00",
                "week_number": 52
            }
        });

        const response = await global_rpc_client.call(
            "system/i18n",
            "timezone_data",
            timezone
        );

        expect(response.status.error).toEqual(false);
        expect(response.status.code).toEqual(1000);
        expect(response.data.timezone).toEqual(timezone);

    });

    it("Gets error on timezone_data() with mocked service data", async() => {

        const timezone = "invalid_timezone";

        network_service_mock({
            url: time_service_url,
            path: `/${timezone}`,
            method: "GET",
            reply_http_code: 404,
            reply_http_body: {
                "error": "bad time zone"
            }
        });

        const response = await global_rpc_client.call(
            "system/i18n",
            "timezone_data",
            timezone
        );

        expect(response.status.error).toEqual(true);
        expect(response.status.code).toEqual(1100);
        expect(response.data).toEqual("bad time zone");

    });

});


