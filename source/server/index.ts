import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";

import config from "../platform/config";
import log from "../platform/system/log";
import { timestamp, uuid } from "../platform/system/utils";
import cache from "../platform/persistence/cache";
import db from "../platform/persistence/db";
import security from "../platform/system/security";
import stats from "../platform/system/stats";
import { execute } from "./execute";
import codes from "../platform/codes";

import type { ZombiExecuteHTTPHeaders, ZombiExecuteContextData } from "./types";

const executor_uuid = uuid();

log.set_uuid(executor_uuid);

const app = express();
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "512mb" }));

app.post(config.server.endpoint, async (req, res) => {

    const headers = (req.headers as ZombiExecuteHTTPHeaders);
    const params = req.body;
    const request_id: string = params.request_id ? params.request_id : uuid();
    const remote_ip = headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0";

    const context: ZombiExecuteContextData = {
        request_id,
        remote_ip,
        executor_uuid,
    };

    const results = await execute(params, context);

    res.json(results);

});

app.listen(
    config.server.http_port,
    config.server.http_ip,
    async () => {

        const start_time: number = timestamp(true);

        const request_id = executor_uuid;

        log.always(`🔥 Starting server running on ${config.server.http_ip}:${config.server.http_port}`, "server/start", { request_id });

        codes.load({ request_id });

        await cache.connect({ request_id });

        await db.connect({ request_id });

        await stats.start({ request_id });

        await security.start({ request_id }, true);

        log.info(`🚀 Server started in ${Date.now() - start_time}ms`, "server/start", { request_id });
    }
);
