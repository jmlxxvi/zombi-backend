import type { ZombiExecuteContextData } from "../../../server/types";

export type ZombiLogInput = (message: string | Error, subject: string, context?: ZombiExecuteContextData) => void;

export type ZombiLogErrorLevels = "DISABLED" | "ERROR" | "INFO" | "DEBUG" | "TRACE";

export type ZombiLogErrorMessage = string | Error;