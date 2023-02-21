let bootstrap_done = false;
const bootstrap_start_time: number = Date.now();

import log from "../../../platform/system/log";
import cache from "../../../platform/persistence/cache";
import db from "../../../platform/persistence/db";
import security from "../../../platform/system/security";
import { timestamp, uuid } from "../../../platform/system/utils";
// import aws from "../../../platform/cloud/aws";
import codes from "../../../platform/codes";
import { notify_errors } from "../../../platform/system/errors/notify";

import type {
    S3Event,
    S3EventRecord
} from "aws-lambda";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const bootstrap_end_time = Date.now();

// import fs from "fs";
import path from "path";
import { ZombiExecuteContextData } from "../../types";


export const handler = async (event: S3Event): Promise<void> => {

    /* 
    https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html

    {
        "Records": [
        {
            "eventVersion": "2.0",
            "eventSource": "aws:s3",
            "awsRegion": "us-west-2",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "EXAMPLE"
            },
            "requestParameters": {
                "sourceIPAddress": "127.0.0.1"
            },
            "responseElements": {
                "x-amz-request-id": "EXAMPLE123456789",
                "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
            },
            "s3": {
                    "s3SchemaVersion": "1.0",
                    "configurationId": "testConfigRule",
                    "bucket": {
                        "name": "my-s3-bucket",
                        "ownerIdentity": {
                            "principalId": "EXAMPLE"
                        },
                        "arn": "arn:aws:s3:::example-bucket"
                    },
                    "object": {
                        "key": "HappyFace.jpg",
                        "size": 1024,
                        "eTag": "0123456789abcdef0123456789abcdef",
                        "sequencer": "0A1B2C3D4E5F678901"
                    }
                }
            }
        ]
    }
    */

    const start_time: number = timestamp(true);

    const context: ZombiExecuteContextData = {
        token: "none",
        request_id: uuid(),
        executor_uuid
    };

    if (!bootstrap_done) {

        bootstrap_done = true;

        log.info("Starting handler", "lambda/handler", context);

        codes.load(context);

        await cache.connect(context);

        await db.connect(context);

        await security.start(context, true);

        log.debug(`Lambda bootstrap run time: ${bootstrap_end_time - bootstrap_start_time}ms`, "lambda/handler", context);

        log.debug(`Lambda start time: ${Date.now() - start_time}ms`, "lambda/handler", context);

    }

    const recs: S3EventRecord[] = event.Records;

    log.debug(`Processing ${recs.length} records`, "lambda/handler:files", context);

    for (const rec of recs) {

        if (rec.eventSource === "aws:s3") {

            let bucket_name = "unknown";

            try {

                bucket_name = rec?.s3?.bucket.name;

                if (bucket_name) {

                    log.debug(`Processing bucket ${bucket_name}`, "lambda/handler:files", context);

                    const file_key = rec?.s3?.object?.key;

                    if (file_key) {

                        log.debug(`Processing file ${file_key}`, "lambda/handler:files", context);

                        // const file_contents = (await aws.s3().getObject({
                        //     Bucket: bucket_name,
                        //     Key: file_key,
                        // }).promise()).Body;

                        const file_contents = "";

                        log.debug(`File size ${file_contents.length}`, "files/run", context);

                        if (bucket_name === process.env.VMD_EDF_UPLOAD_BUCKET) {

                            try {

                                if (path.extname(file_key) === ".zip") {

                                    log.debug(`File ${file_key} is a zip file`, "files/run", context);

                                } else {
                                    log.debug(`File ${file_key} is not a zip file`, "files/run", context);
                                }

                            } catch (error) {


                                log.error(error, "files/run", context);
                            }




                        } else {
                            console.error("WRONG BUCKET NAME");
                        }

                    } else {

                        log.error("No file name found on data", "lambda/handler:files", context);

                    }

                } else {

                    log.error("No bucket name found on data", "lambda/handler:files", context);

                }

            } catch (error) {

                notify_errors({
                    subject: `files > ${bucket_name}`,
                    message: error.stack || error,
                    context
                });

                log.error(error, "lambda/handler:files", context);

                throw error;

            }

        } else {

            log.error(`Unknown event source ${rec.eventSource ? rec.eventSource : ""}`, "lambda/handler:files", context);

        }

    }

};


// const sanitized_key = decodeURIComponent(file_key.replace(/\+/g, "_"));

// console.log(bucket_name, file_key, sanitized_key);

// const db_data = await db.sql({
//     query: "select count(*) from patients"
// });


// console.log(db_data);
// console.log(file_contents);



// for (const signal of signals) {

//     await db.sql({
//         query: `DELETE FROM edf_signals
//                 WHERE 1=1
//                     and device_id = :device_id
//                     and patient_id = :patient_id
//                     and file_type = :file_type
//                     and signal_label = :signal_label
//                     and at_year = :at_year
//                     and at_month = :at_month
//                     and at_day = :at_day
//                     and at_hour = :at_hour`,
//         bind: [
//             device_id,
//             patient_id,
//             file_type,
//             signal.label,
//             signal.year,
//             signal.month,
//             signal.day,
//             signal.hour,
//         ]
//     });

//     await db.sql({
//         query: `INSERT INTO edf_signals
//                     (device_id, patient_id, file_type, signal_label, standard_signal_label, dimension, at_year, at_month, at_day, at_hour, time_zone, samples_count, samples_physical_sum, samples_physical_min, samples_physical_max, samples_physical_avg, filename)
//                 VALUES
//                     (:device_id, :patient_id, :file_type, :signal_label, :standard_signal_label, :dimension, :at_year, :at_month, :at_day, :at_hour, :time_zone, :samples_count, :samples_physical_sum, :samples_physical_min, :samples_physical_max, :samples_physical_avg, :filename)`,
//         bind: [
//             device_id,
//             patient_id,
//             file_type,
//             signal.label,
//             standard_signal_label(signal.label),
//             signal.dimension,
//             signal.year,
//             signal.month,
//             signal.day,
//             signal.hour,
//             time_zone,
//             signal.cnt,
//             signal.sum,
//             signal.min,
//             signal.max,
//             signal.avg,
//             file.name
//         ]
//     });
// }

/*

const run2 = async (bucket_name: string, file_key: string, file_contents: Buffer, request_id: string): Promise<void> => {

    if (bucket_name === process.env.VMD_EDF_UPLOAD_BUCKET) {

        try {

            const zip = new JSZip();

            if (path.extname(file_key) === ".zip") {

                const [patient_id, file_type] = file_key.split("/");

                log.debug(`Patient ID is ${patient_id}`, "files/run", context);
                log.debug(`File type: ${file_type}`, "files/run", context);

                const patient_time_zone_db_data = await db.sql({
                    query: "select default_time_zone from patients where id = :id",
                    bind: [patient_id]
                });

                const time_zone = (patient_time_zone_db_data.length > 0) ? patient_time_zone_db_data[0].default_time_zone : "America/Chicago";

                log.debug(`Patient TZ is ${time_zone}`, "files/run", context);

                const device_db_data = await db.sql({
                    query: "select id from patient_devices where patient_id = :patient_id",
                    bind: [patient_id]
                });

                if (device_db_data.length > 0) {

                    const device_id = device_db_data[0].id;

                    log.debug(`Device ID is ${device_id}`, "files/run", context);

                    // const zip_data = await zip.loadAsync(file_contents);

                    // --------------

                    const fid = "z01";

                    const out_dir = `/tmp/${fid}/`;

                    // const file_contents = fs.readFileSync("files/luisa/1657817272543_JGyvsr3hv7svQdycgdHRed.zip");
                    // const file_contents = fs.readFileSync("files/luisa/1650567138324_Gp5Q9pDEYGNCoFMqf2moDt.zip");

                    const zip_data = await zip.loadAsync(file_contents);

                    const keys = Object.keys(zip_data.files);

                    fs.mkdirSync(out_dir, { recursive: true });

                    for (const key of keys) {

                        const file = zip_data.files[key];

                        if (file.dir) {
                            fs.mkdirSync(file.name);
                        } else {
                            console.log(file.name);

                            if (path.extname(file.name) === ".edf" && file.name.substring(0, 3) !== "WD_") { // Trilogy WD_ files are not loaded

                                const buffer = Buffer.from(await file.async("arraybuffer"));
                                fs.writeFileSync(`${out_dir}/${file.name}`, buffer);
                                // const edfdata = edf.parser(buffer, { data_as_objects: true });
                                // console.log(edfdata.header);

                            } else {
                                console.log("Skipping " + file.name);
                            }
                        }
                    }

                    // --------------

                    // await zip.loadAsync(file_contents).then(function(contents) {
                    //     Object.keys(contents.files).forEach(function(filename) {
                    //         zip.file(filename)?.async("nodebuffer").then(function(content) {
                    //             // const dest = "/tmp/xx/" + filename;
                    //             const dest = filename;
                    //             fs.writeFileSync(dest, content);
                    //         });
                    //     });
                    // });

                    fs.readdirSync(out_dir).forEach(file => {
                        console.log(file);
                    });



                } else {
                    log.error(`Device not found for patient ${patient_id}`, "files/run", context);
                }



            } else {
                log.debug(`File ${file_key} is not a zip file`, "files/run", context);
            }

        } catch (error) {
            // TODO send Slack/Teams message
            log.error(error, "files/run", context);
        }




    } else {
        console.error("WRONG BUCKET NAME");
    }

};

INSERT INTO edf_signals
(id, created_at, updated_at, device_id, patient_id, file_type, signal_label, standard_signal_label, dimension, at_year, at_month, at_day, at_hour, time_zone, samples_count, samples_physical_sum, samples_physical_min, samples_physical_max, samples_physical_avg, filename)
VALUES(uuid_generate_v4(), now(), '', ?, ?, '', '', '', '', 0, 0, 0, 0, '', 0, 0, 0, 0, 0, '');

{
  version: '0',
  patient: 'X X X X',
  info: 'Startdate 14-APR-2022 X X TGY100 0 TV117032946 1054260B 0x8408 14.2.05',
  start_date: '14.04.22',
  start_time: '13.57.55',
  header_bytes: '2816',
  data_format: 'EDF+D',
  data_records: 0,
  data_record_duration: 300,
  channel_count: 10,
  duration: 0,
  duration_hms: '00:00:00',
  start_date_datetime: 2022-04-14T13:57:55.000Z,
  start_date_timestamp: 1649944675000,
  end_date_timestamp: 1649944675000,
  end_date_datetime: 2022-04-14T13:57:55.000Z,
  bytes_per_sample: 2,
  has_annotations: true,
  realchannels_count: 9,
  annotation_bytes: 60,
  sampling_rate: 3000,
  sample_size: 54120
}

*/


// await db.sql({
//     query: `INSERT INTO edf_loaded_files
//                 (device_id, patient_id, filename, file_type, file_version, patient, info, data_format, data_records, data_record_duration, channel_count, duration, duration_hms, start_date_timestamp, end_date_timestamp, bytes_per_sample, has_annotations, annotation_bytes, sampling_rate, message)
//             VALUES
//                 (:device_id, :patient_id, :filename, :file_type, :file_version, :patient, :info, :data_format, :data_records, :data_record_duration, :channel_count, :duration, :duration_hms, :start_date_timestamp, :end_date_timestamp, :bytes_per_sample, :has_annotations, :annotation_bytes, :sampling_rate, :message)`,
//     bind: [
//         device_id, 
//         patient_id, 
//         file.name,
//         file_type,
//         edfdata.header.version,
//         edfdata.header.patient,
//         edfdata.header.info,
//         edfdata.header.data_format,
//         edfdata.header.data_records,
//         edfdata.header.data_record_duration,
//         edfdata.header.channel_count,
//         edfdata.header.duration,
//         edfdata.header.duration_hms,
//         edfdata.header.start_date_timestamp,
//         edfdata.header.end_date_timestamp,
//         edfdata.header.bytes_per_sample,
//         edfdata.header.has_annotations,
//         edfdata.header.annotation_bytes,
//         edfdata.header.sampling_rate,
//         "No errors"
//     ]
// });