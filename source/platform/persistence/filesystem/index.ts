// ---------------------------------------------
// This code is still experimental, don't use it
// ---------------------------------------------

import config from "../../config";

import fs from "fs"; 

const fsp = fs.promises;

export const write = async (path: string, data: string | Uint8Array): Promise<void> => {

    return fsp.writeFile(`${config.storage.path}/${path}`, data);

};

export const read = async (path: string): Promise<string | Buffer> => {

    return fsp.readFile(`${config.storage.path}/${path}`, { encoding: "utf8" });

};

export const stream = (path: string, flags = "a"): fs.WriteStream => {

    return fs.createWriteStream(`${config.storage.path}/${path}`, { flags });

};

