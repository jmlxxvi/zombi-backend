import config from "../../config";
import db from ".";

import fs from "fs";
import { normalize_bind } from "./utils";

const db_name = process.env.ZOMBI_DB_DEFAULT_NAME || "default";
const url_parts = new URL(config.db.databases[db_name].uri);
const db_type = url_parts.protocol.replace(":", "");

const test_table = "TESTING_TABLE_3156232";

type SelectType = {
    id: number,
    a: number,
    b: string,
    c: string,
    A: number,
    B: string,
    C: string
}

describe("DB Tests", () => {

    it("Responds with error on disconnected db", async () => {

        try {
            await db.sql<any>({
                query: `select a as "A", b as "B" from ${test_table}`
            });
            throw new Error("Should have thrown");
        } catch (error) {
            expect(error.message).toMatch("Database default is not connected");
        }
    });

    it("Returns an error on incorrect SQL syntax", async () => {

        try {
            await db.connect({ request_id: "test" });
            await db.sql<any>({ query: "Bad SQL" });
            throw new Error("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            switch (db_type) {
                case "postgresql":
                    expect(error.message).toMatch("syntax error at or near \"Bad\" SQL: Bad SQL BIND: []");
                    break;

                case "mysql":
                    expect(error.message).toMatch("You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'Bad SQL' at line 1 SQL: Bad SQL BIND: []");
                    break;

                case "oracle":
                    expect(error.message).toMatch("ORA-00900: invalid SQL statement SQL: Bad SQL BIND: []");
                    break;

                default:
                    throw new Error("Invalid DB type");
            }
        }
    });

    it("Creates test table and returns standard object", async () => {

        let query: string;

        switch (db_type) {
            case "postgresql":
                query = `create table if not exists ${test_table}  (
                    id integer GENERATED BY DEFAULT AS IDENTITY (START WITH 200 INCREMENT BY 1),
                    a integer GENERATED BY DEFAULT AS IDENTITY (START WITH 100 INCREMENT BY 1),
                    b varchar(100),
                    c timestamp
                )`;
                break;

            case "mysql":
                query = `create table if not exists ${test_table}  (
                    id integer NOT NULL AUTO_INCREMENT,
                    a integer NOT NULL,
                    b varchar(100),
                    c timestamp,
                    PRIMARY KEY (id)
                ) AUTO_INCREMENT=200`;
                break;

            case "oracle":
                query = `
                        DECLARE
                            v_sql LONG;
                        BEGIN
                            v_sql:='create table ${test_table}  (
                                id NUMBER GENERATED by default on null as IDENTITY (START with 200 INCREMENT by 1),
                                a integer NOT NULL,
                                b varchar2(100),
                                c timestamp,
                                PRIMARY KEY (id)
                            )';

                        EXECUTE IMMEDIATE v_sql;
                        
                        EXCEPTION
                            WHEN OTHERS THEN
                            IF SQLCODE = -955 THEN
                                NULL; -- suppresses ORA-00955 exception
                            ELSE
                                RAISE;
                            END IF;
                        END;`;
                break;

            default:
                throw new Error("Invalid DB type");
        }

        const response = await db.sql<any>({ query });


        expect(response).toHaveLength(1);

    });

    it("Inserts into test table", async () => {
        const response1 = await db.sql<any>({
            query: `insert into ${test_table} (a, b) values (:a, :b)`,
            bind: [999, "Test Data"]
        });

        expect(response1).toEqual(expect.any(Array));
        expect(response1).toHaveLength(1);

        const response2 = await db.sql<any>({
            query: `insert into ${test_table} (a, b) values (:a, :b)`,
            bind: [1000, "Test Data 2"]
        });

        expect(response2).toEqual(expect.any(Array));
        expect(response2).toHaveLength(1);
    });

    it("Selects from test table", async () => {
        const response = await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table}`
        });

        expect(response).toHaveLength(2);

        expect(response[0].A).toEqual(999);
        expect(response[0].B).toMatch("Test Data");

        expect(response[1].A).toEqual(1000);
        expect(response[1].B).toMatch("Test Data 2");
    });

    it("Selects from test table using where", async () => {
        const response = await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table} where a = :a`,
            bind: [999]
        });


        expect(response).toHaveLength(1);

        expect(response[0].A).toEqual(999);
        expect(response[0].B).toMatch("Test Data");
    });

    it("Selects from test table using sql from file", async () => {

        const file = "/tmp/test.temp.sql";

        fs.writeFileSync(file, `select a as "A", b as "B" from ${test_table} where a = :a`);

        const query = await db.file(file);

        const response = await db.sql<any>({
            query,
            bind: [999]
        });


        expect(response).toHaveLength(1);

        expect(response[0].A).toEqual(999);
        expect(response[0].B).toMatch("Test Data");
    });

    it("Returns an error for empty query", async () => {

        try {
            await db.sql<any>({ query: "" });

            throw new Error("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("Empty SQL query text");
        }
    });

    it("Returns an error for invalid database name", async () => {

        try {
            await db.sql<any>({ query: "select * from table", db_name: "this_database_does_not_exist" });

            throw new Error("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("Database this_database_does_not_exist is not connected");
        }
    });


    it("Deletes from test table using where", async () => {
        const response = await db.sql<any>({
            query: `delete from ${test_table} where a = :a`,
            bind: [1000]
        });

        expect(response[0]).toHaveProperty("rows", 1);

    });

    it("Selects from test table non existent row", async () => {
        const response = await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table} where a = :a`,
            bind: [1000]
        });


        expect(response).toHaveLength(0);
    });

    it("Selects (R) from test table non existent row", async () => {
        const response = db.row(await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table} where a = :a`,
            bind: [1000]
        }));

        expect(response).toBeNull();
    });

    it("Selects (V) from test table non existent row", async () => {
        const response = db.value(await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table} where a = :a`,
            bind: [1000]
        }));

        expect(response).toBeNull();
    });

    it("Selects (R) from test table existent row", async () => {
        const response = db.row(await db.sql<any>({
            query: `select a as "A", b as "B" from ${test_table} where a = :a`,
            bind: [999]
        }));

        expect(response).not.toBeNull();
        expect(response!.A).toEqual(999);
        expect(response!.B).toMatch("Test Data");
    });

    it("Selects (V) from test table existent row (number)", async () => {
        const response = db.value(await db.sql<any>({
            query: `select a from ${test_table} where a = :a`,
            bind: [999]
        }));

        expect(response).not.toBeNull();

        expect(response).toEqual(999);
    });

    it("Selects (V) from test table existent row (string)", async () => {
        const response = db.value(await db.sql<any>({
            query: `select b from ${test_table} where a = :a`,
            bind: [999]
        }));

        expect(response).not.toBeNull();
        expect(response).toEqual(expect.any(String));
        expect(response).toMatch("Test Data");
    });

    it("Selects (V) from test table existent row (null)", async () => {
        const response = db.value(await db.sql<any>({
            query: `select null from ${test_table} where a = :a`,
            bind: [999]
        }));

        expect(response).toBeNull();
    });

    it("Deletes from test table without where", async () => {
        const response = await db.sql<any>({ query: `delete from ${test_table}` });

        expect(response[0]).toHaveProperty("rows", 1);

    });

    it("Inserts into test table using SQL functions", async () => {
        const response1 = await db.insert({
            table: test_table,
            values: {
                a: 1001,
                b: "Test Data F1"
            }
        });

        expect(response1[0]).toHaveProperty("rows", 1);

        const response2 = await db.insert({
            table: test_table,
            values: {
                a: 1002,
                b: "Test Data F2"
            }
        });

        expect(response2[0]).toHaveProperty("rows", 1);

    });

    it("Selects from test table using SQL functions ordered first column asc", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "a": "asc"
            }
        });

        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");

        expect(response[1].a || response[1].A).toEqual(1002);
        expect(response[1].b || response[1].B).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered first column desc", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "a": "desc"
            }
        });

        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1002);
        expect(response[0].b || response[0].B).toMatch("Test Data F2");

        expect(response[1].a || response[1].A).toEqual(1001);
        expect(response[1].b || response[1].B).toMatch("Test Data F1");
    });

    it("Selects from test table using SQL functions ordered second column asc", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "b": "asc",
                "a": "works_anyway_defaults_to_asc"
            }
        });

        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");

        expect(response[1].a || response[1].A).toEqual(1002);
        expect(response[1].b || response[1].B).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using array", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: [1, 2]
        });

        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");

        expect(response[1].a || response[1].A).toEqual(1002);
        expect(response[1].b || response[1].B).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using number", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: 1
        });



        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");

        expect(response[1].a || response[1].A).toEqual(1002);
        expect(response[1].b || response[1].B).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using string", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: "a"
        });



        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");

        expect(response[1].a || response[1].A).toEqual(1002);
        expect(response[1].b || response[1].B).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered second column desc", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "b": "desc",
                "a": "asc"
            }
        });

        expect(response).toHaveLength(2);

        expect(response[0].a || response[0].A).toEqual(1002);
        expect(response[0].b || response[0].B).toMatch("Test Data F2");

        expect(response[1].a || response[1].A).toEqual(1001);
        expect(response[1].b || response[1].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["a", "b"],
            where: {
                a: 1001
            }
        });

        expect(response).toHaveLength(1);

        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where second column array using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: ["b"],
            where: {
                a: 1001
            }
        });

        expect(response).toHaveLength(1);

        expect(response[0].a || response[0].A).toBeUndefined();
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where second column string using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: "b",
            where: {
                a: 1001
            }
        });

        expect(response).toHaveLength(1);
        expect(response[0].a || response[0].A).toBeUndefined();
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where second two columns string using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: "b, a",
            where: {
                a: 1001
            }
        });

        expect(response).toHaveLength(1);
        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where as an array using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: "b, a",
            where: ["a", 1001]
        });

        expect(response).toHaveLength(1);
        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Selects from test table using where as an integer using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: "b, a",
            where: 202
        });

        expect(response).toHaveLength(1);
        expect(response[0].a || response[0].A).toEqual(1001);
        expect(response[0].b || response[0].B).toMatch("Test Data F1");
    });

    it("Updates test table using SQL functions", async () => {
        const response = await db.update({
            table: test_table,
            values: {
                b: "Test Data F1 Updated"
            },
            where: {
                a: 1001
            }
        });

        expect(response[0].rows).toEqual(1);
    });

    it("Selects updated data from test table using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            columns: "b",
            where: {
                a: 1001
            }
        });

        expect(response).toHaveLength(1);
        expect(response[0].b || response[0].B).toMatch("Test Data F1 Updated");
    });

    it("Deletes from test table using SQL functions", async () => {
        const response = await db.delete({
            table: test_table,
            where: {
                a: 1002
            }
        });

        expect(response[0].rows).toEqual(1);
    });

    it("Selects from test table non existent row using SQL functions", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            where: {
                a: -1
            }
        });

        expect(response).toHaveLength(0);
    });


    it("Deletes from test table without where again", async () => {
        const response = await db.sql<any>({ query: `delete from ${test_table}` });

        expect(response[0]).toHaveProperty("rows", 1);
    });

    it("Inserts into test table using SQL functions - 1", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                a: 1003,
                b: "Identity Test"
            }
        });

        expect(response[0].rows).toEqual(1);
    });

    it("Inserts into test table using SQL functions - 2", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                b: "Identity Test 2"
            },
        });

        expect(response[0].rows).toEqual(1);
    });

    it("Inserts into test table using SQL functions - 3", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                b: "Identity Test 3",
                c: new Date().toISOString()
            },
        });

        expect(response[0].rows).toEqual(1);
    });

    it("Counts the rows of the table without where clause using SQL functions", async () => {
        const response = await db.count({
            table: test_table
        });

        expect(response).toEqual(3);
    });

    it("Counts the rows of the table with true where clause using SQL functions", async () => {
        const response = await db.count({
            table: test_table,
            where: {
                a: 1003
            }
        });

        expect(response).toEqual(1);
    });

    it("Counts the rows of the table with false where clause using SQL functions", async () => {
        const response = await db.count({
            table: test_table,
            where: {
                a: 99999999
            }
        });

        expect(response).toEqual(0);
    });

    it("Selects rows from the table with where clause using SQL functions and negate operator (object)", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            where: {
                "!a": 99999999,
                b: "Identity Test 3"
            }
        });

        expect(response).toHaveLength(1);
    });

    it("Selects rows from the table with where clause using SQL functions and negate operator (array)", async () => {
        const response = await db.select<SelectType>({
            table: test_table,
            where: ["!a", 99999999]
        });

        expect(response).toHaveLength(3);
    });

    it("Counts the rows of the table with where clause using SQL functions and negate operator (object)", async () => {
        const response = await db.count({
            table: test_table,
            where: {
                "!a": 99999999,
                b: "Identity Test 3"
            }
        });

        expect(response).toEqual(1);
    });

    it("Counts the rows of the table with where clause using SQL functions and negate operator (array)", async () => {
        const response = await db.count({
            table: test_table,
            where: ["!a", 99999999]
        });

        expect(response).toEqual(3);
    });

    it("Should create a transaction and finish it without errors", async () => {

        // TODO Oracle does not support transaction semantics like this.
        // We need to create an API on db module for that
        if (db_type !== "oracle") {

            await db.sql<any>({ query: `delete from ${test_table}` });

            await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [100, "one"] });

            await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [0, "two"] });

            try {

                const operations = [
                    {
                        query: `update ${test_table} set a = :a where b = :b`,
                        bind: [0, "one"]
                    },
                    {
                        query: `update ${test_table} set a = :a where b = :b`,
                        bind: [100, "two"]
                    }
                ];

                await db.transaction(operations, "default");

                const one = db.value(await db.sql<any>({ query: `select a from ${test_table} where b = 'one'` }));
                const two = db.value(await db.sql<any>({ query: `select a from ${test_table} where b = 'two'` }));

                expect(one).toEqual(0);
                expect(two).toEqual(100);

            } catch (e) {

                throw new Error("Should have not thrown: " + e.message);

            }

        }

    });

    it("Should create a transaction and rollback on error", async () => {

        await db.sql<any>({ query: `delete from ${test_table}` });

        await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [100, "one"] });

        await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [0, "two"] });

        try {

            const operations = [
                {
                    query: `update ${test_table} set a = :a where b = :b`,
                    bind: [0, "one"]
                },
                {
                    query: `update ${test_table} set x = :a where b = :b`,
                    bind: [100, "two"]
                }
            ];

            await db.transaction(operations);

            throw new Error("Should have thrown");

        } catch (e) {

            const one = db.value(await db.sql<any>({ query: `select a from ${test_table} where b = 'one'` }));
            const two = db.value(await db.sql<any>({ query: `select a from ${test_table} where b = 'two'` }));

            expect(one).toEqual(100);
            expect(two).toEqual(0);

        }

    });

    it("Should create a transaction and fail it rolling back the changes", async () => {

        await db.sql<any>({ query: `delete from ${test_table}` });

        await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [100, "one"] });

        await db.sql<any>({ query: `insert into ${test_table} (a, b) values (:a, :b)`, bind: [0, "two"] });

        const db_client = await db.aquire_pool_client();

        try {

            await db_client.sql<SelectType>({ query: "begin" });

            await db_client.sql<SelectType>({
                query: `update ${test_table} set a = :a where b = :c`,
                bind: [0, "one"]
            });

            throw new Error("Not enough funds");

        } catch (error) {

            await db_client.sql<SelectType>({ query: "rollback" });

            const one = await db_client.sql<SelectType>({ query: `select a from ${test_table} where b = 'one'` });

            expect(one[0].a).toEqual(100);

        } finally {

            await db_client.release_pool_client();

        }

    });

    it("Gets sequence numbers using SQL functions", async () => {
        const response1 = await db.sequence();
        const response2 = await db.sequence();

        expect(response2).toEqual(response1 + 1);
    });

    it("Drops test table and returns standard object", async () => {
        const response = await db.sql<any>({ query: `drop table ${test_table}` });

        expect(response).toHaveLength(1);
        expect(response[0].rows).toBeNull();

    });


    it("Checks normalize_bind()", async () => {

        const response0 = normalize_bind([]);
        expect(response0).toEqual([]);

        const response1 = normalize_bind("ok");
        expect(response1).toEqual(["ok"]);

        const response2 = normalize_bind([1, 2, "a"]);
        expect(response2).toEqual([1, 2, "a"]);

        const response3 = normalize_bind(null);
        expect(response3).toEqual([]);

        const response4 = normalize_bind(undefined);
        expect(response4).toEqual([]);

    });

});

afterAll(async () => {
    db.disconnect({ request_id: "test" });
});

