import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

import validator from "validator";

type ValidationResults = {
    valid: boolean,
    message: string
}

export const validate_schema = <T>(schema: Record<string, unknown>, data: T): ValidationResults => {

    const valid = ajv.validate(schema, data);

    if (valid) {

        return {
            valid: true,
            message: "ok"
        };

    } else {

        return {
            valid: false,
            message: ajv.errorsText()
        };

    }

};

// https://www.npmjs.com/package/validator
export const validate_uuid = (uuid: string): ValidationResults => {

    const valid = validator.isUUID(uuid);

    if (valid) {

        return {
            valid: true,
            message: "ok"
        };

    } else {

        return {
            valid: false,
            message: "Invalid UUID"
        };

    }

};


