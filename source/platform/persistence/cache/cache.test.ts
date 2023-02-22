import cache from ".";
import { random_hexa_chars } from "../../system/utils";

const key_prefix = "TESTING_ENTRY";
const key_part = random_hexa_chars();

const cache_key_1 = `${key_prefix}_1_${key_part}`;
const cache_key_2 = `${key_prefix}_2_${key_part}`;
const cache_key_3 = `${key_prefix}_3_${key_part}`;

beforeAll(async () => {
    await cache.disconnect();
});

afterAll(async () => {
    await cache.del(cache_key_1);
    await cache.del(cache_key_2);
    await cache.disconnect();
});

describe("CACHE Tests", () => {

    it("Responds with error on disconnected cache", async () => {

        const response1 = await cache.set(cache_key_1, "123456789");
        expect(response1).toEqual(null);

        const response2 = await cache.get(cache_key_1);
        expect(response2).toEqual(null);

        const response3 = await cache.del(cache_key_1);
        expect(response3).toEqual(0);

        const response4 = await cache.keys("*");
        expect(response4).toEqual([]);

        const response5 = await cache.generic("INCR", "test_key");
        expect(response5).toEqual(false);

        const response6 = await cache.exists(cache_key_1);
        expect(response6).toEqual(-1);

        const response7 = cache.is_connected();
        expect(response7).toEqual(false);

        const response8 = await cache.fun(cache_key_1, async () => { console.log("ok"); }, 10);
        expect(response8).toEqual(false);

        const response9 = await cache.increment_by(cache_key_1);
        expect(response9).toEqual(-1);

    });

    it("Responds with 'OK' on valid set", async () => {

        await cache.connect({ request_id: "test" });

        const response = await cache.set(cache_key_1, "123456789");

        expect(response).toMatch("OK");
    });

    it("Gets created value from cache", async () => {
        const response = await cache.get(cache_key_1);

        expect(response).toEqual(expect.any(String));
        expect(response).toMatch("123456789");
    });

    it("Deletes value from cache", async () => {
        const response = await cache.del(cache_key_1);

        expect(response).toEqual(expect.any(Number));
        expect(response).toEqual(1);
    });

    it("Gets empty value from cache after delete", async () => {
        const response = await cache.get(cache_key_1);

        expect(response).toBeNull();
    });

    it("Set value of empty key with set_if_higher", async () => {
        const response = await cache.set_if_higher(cache_key_2, 10);

        expect(response).toEqual(10);
    });

    it("Set value of key with set_if_higher, lower value", async () => {
        const response = await cache.set_if_higher(cache_key_2, 5);

        expect(response).toEqual(10);
    });

    it("Set value of key with set_if_higher, higher value", async () => {
        const response = await cache.set_if_higher(cache_key_2, 15);

        expect(response).toEqual(15);
    });

    it("Set value of empty key with set_if_lower", async () => {
        const response = await cache.set_if_lower(cache_key_2, 10);

        expect(response).toEqual(10);
    });

    it("Set value of key with set_if_lower, lower value", async () => {
        const response = await cache.set_if_lower(cache_key_2, 5);

        expect(response).toEqual(5);
    });

    it("Set value of key with set_if_lower, higher value", async () => {
        const response = await cache.set_if_lower(cache_key_2, 15);

        expect(response).toEqual(5);
    });

    it("Set value of empty key with cache.generic", async () => {
        const response = await cache.generic(
            "INCRBY",
            cache_key_3,
            12
        );

        expect(response).toEqual(12);
    });

    it("Set value of key with cache.generic", async () => {
        const response = await cache.generic(
            "INCRBY",
            cache_key_3,
            2
        );

        expect(response).toEqual(14);
    });


    it("Set value of key with cache.generic for a non existen operation", async () => {
        const response = await cache.generic(
            "BAD_OPERATION",
            cache_key_3,
            2
        );

        expect(response).toEqual(false);
    });

    it("Get keys with key_prefix", async () => {

        const response = await cache.keys(cache_key_3);

        expect(response).toEqual([cache_key_3]);
    });

    it("Checks if keys exists", async () => {

        const response = await cache.exists(cache_key_3);

        expect(response).toEqual(1);
    });

    it("Checks if fun is memoized", async () => {

        // TODO add logic to check the data after the TTL expires
        const response = await cache.fun(cache_key_1, async () => {
            return 1;
        }, 2);

        expect(response).toEqual(1);
    });

    it("Increments value with increment_by", async () => {

        await cache.set(cache_key_1, "999");

        const response = await cache.increment_by(cache_key_1, 1);

        expect(response).toEqual(1000);
    });



});


