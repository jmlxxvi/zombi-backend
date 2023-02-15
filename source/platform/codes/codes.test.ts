import codes from ".";

describe("CODES Tests", () => {

    it("Loads codes files without errors", async () => {

        const error = codes.load();

        expect(error).toBeFalsy();

    });

    it("Gets invalid message for code not found", async () => {

        const response = codes.message(-9999);

        expect(response).toEqual("Message not found for code -9999");

    });

});

