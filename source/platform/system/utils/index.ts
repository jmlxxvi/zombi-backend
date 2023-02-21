import crypto from "crypto";

export const timestamp = (ms = false): number => { return ms ? Date.now() : Math.floor(Date.now() / 1000); };

// TODO substr is marked as deprecated on typescript/lib/lib.es5.d.ts
export const string_end = (s: string | null | undefined, size = 8): string => s ? "..." + s.slice(-1 * size) : "<invalid_string>";

export const pad = (value: number, length = 10, padding_char = "0") => (Array(length).join(padding_char) + value).slice(-1 * length);

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const uuid = (): string => crypto.randomUUID();

export const b64d = (string: string): string => Buffer.from(string, "base64").toString("utf-8");

export const b64e = (string: string): string => Buffer.from(string, "utf-8").toString("base64");

export const date_format = (date: any, format: string, use_utc = false): string => {
    const f = use_utc ? "getUTC" : "get";
    return format.replace(/%[YmdHMSx]/g, (m: string) => {
        switch (m) {
            case "%Y": return date[f + "FullYear"](); // no leading zeros required
            case "%m": m = 1 + date[f + "Month"](); break;
            case "%d": m = date[f + "Date"](); break;
            case "%H": m = date[f + "Hours"](); break;
            case "%M": m = date[f + "Minutes"](); break;
            case "%S": m = date[f + "Seconds"](); break;
            case "%x": return ("00" + date[f + "Milliseconds"]()).slice(-3);
        }
        return ("0" + m).slice(-2);
    });
};

export const random_hexa_chars = (size = 8) => crypto.randomBytes(size).toString("hex").toUpperCase();

export const yes_or_not = (thing: string | undefined): boolean => (thing?.toUpperCase() === "YES" || thing?.toUpperCase() === "Y" || thing?.toUpperCase() === "TRUE");

