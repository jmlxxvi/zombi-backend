import { http } from "../../../platform/client";
import { Zombii18nTimeServiceData } from "./types";

export const timezone_service_data = async (timezone: string) => {

    const response = await http<Zombii18nTimeServiceData>({
        method: "get",
        url: `https://worldtimeapi.org/api/timezone/${timezone}`
    });

    return response.data;

};

/* 
{
  "abbreviation": "-03",
  "client_ip": "190.16.105.200",
  "datetime": "2022-12-29T11:39:49.070948-03:00",
  "day_of_week": 4,
  "day_of_year": 363,
  "dst": false,
  "dst_from": null,
  "dst_offset": 0,
  "dst_until": null,
  "raw_offset": -10800,
  "timezone": "America/Argentina/Salta",
  "unixtime": 1672324789,
  "utc_datetime": "2022-12-29T14:39:49.070948+00:00",
  "utc_offset": "-03:00",
  "week_number": 52
}

{
  "abbreviation": "-03",
  "client_ip": "190.16.105.200",
  "datetime": "2022-12-29T11:49:08.012311-03:00",
  "day_of_week": 4,
  "day_of_year": 363,
  "dst": false,
  "dst_from": null,
  "dst_offset": 0,
  "dst_until": null,
  "raw_offset": -10800,
  "timezone": "America/Argentina/Buenos_Aires",
  "unixtime": 1672325348,
  "utc_datetime": "2022-12-29T14:49:08.012311+00:00",
  "utc_offset": "-03:00",
  "week_number": 52
}

*/
