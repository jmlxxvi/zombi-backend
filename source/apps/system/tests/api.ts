// For some tests we could use the public API for system on system/public/api
// but some tests need a non-public function, so we put those here.

import type { ZombiAPIReturnData, ZombiExecuteContextData } from "../../../server/types";

const ping = async (_args: never, _context: ZombiExecuteContextData): Promise<ZombiAPIReturnData<any>> => 
    ({ error: false, code: 1000, data: "pong" });

export {
    ping,
};
