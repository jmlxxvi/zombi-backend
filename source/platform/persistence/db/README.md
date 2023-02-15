# Zombi Database Abstraction

## Table of Contents
- [Intro](#Intro)
- [Installation](#Installation)
- [Usage](#Usage)
- [Functions](#Functions)

## Intro
To connect and use database services Zombi provides abstractions via functions to connect, query and disconnect from those services.

## Installation

### PostgreSQL

docker run -d \
    -p 5432:5432 \
    --name zombi-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e PGDATA=/var/lib/postgresql/data/pgdata \
    postgres

To intstall PostgreSQL on Ubuntu 20.04:

```bash
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt -y install postgresql-12 postgresql-client-12
```

To check it is running:

```bash
systemctl status postgresql.service
systemctl status postgresql@12-main.service
```
Once you have a working PostgreSQL server, create a user and a database with:

> Make suue you have the environment set before executing the following commands as they need some variables to be available.

```bash
 sudo -u postgres psql -c "CREATE USER ${ZOMBI_DB_USER} WITH PASSWORD '${ZOMBI_DB_PASS}';"
 sudo -u postgres psql -c "CREATE DATABASE ${ZOMBI_DB_NAME} OWNER=${ZOMBI_DB_USER};"
```

That will create a database and a user for the server to use, then:

```bash
npm run schema
```

The above NPM comand will create the database tables needed.

To confirm you can connect to the database run:

```bash
psql postgresql://${ZOMBI_DB_USER}:${ZOMBI_DB_PASS}@localhost:5432/${ZOMBI_DB_NAME}
```

If the connection is successfull you'll see:

```bash
psql (12.6 (Ubuntu 12.6-0ubuntu0.20.04.1))
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
Type "help" for help.
```

## Usage

To use the database functions first import the database module

```typescript
import db from "./db";
```

The actual path to `./db` depends on the relative path of the file you are working on with the file `source/core/db/index.ts`

For example if you are importing the database module from ``source/api/my_api_module/my_module_file.ts` you'll need to use:

```typescript
import db from "../../core/db";
```
## Functions

### db.sql()
Once imported the module has some functions, where the most used is:

```typescript
const data = await db.sql(<params>: ZombiDBSQLArguments);
```

Where `<params>` is and object that defines the SQL text to execute, the bind variables to use and the database to send the SQL to.

```typescript
export type ZombiDBSQLBind = string | number | (string | number)[];

export type ZombiDBSQLArguments = {
    query: string,
    bind?: ZombiDBSQLBind,
    db_name?: string,
    identity?: string | boolean
};
```

`db_name` defaults to "default".

`indentity` is used to select a column that will return the data when using an autoincrement value on inserts.

As an example:

```typescript
const data = await db.sql({
    query: "select username, email, timezone from users where username = :username",
    bind: ["system"]
})
```

Here db_name is omitted and the resulting data is with the form:

```typescript
[
    {
        username: "system",
        email: "zombidevelopment@gmail.com",
        timezone: "America/Argentina/Buenos_Aires"
    }
]
```

That is an array of objects with the data resulting from the database. In case there is no data reurned the results is an empty array: `[]`

If there is an error while running the query the function throws an error like:

```typescript
await db.sql({ query: "select * from non_existent_table" });
```

```bash
error: relation "non_existent_table" does not exist SQL: select * from non_existent_table BIND: []    
at Connection.parseE (source/node_modules/pg/lib/connection.js:614:13)    
at Connection.parseMessage (source/node_modules/pg/lib/connection.js:413:19)    
at Socket.<anonymous> (source/node_modules/pg/lib/connection.js:129:22)    
at Socket.emit (events.js:314:20)    
at Socket.EventEmitter.emit (domain.js:483:12)    
at addChunk (_stream_readable.js:297:12)    
at readableAddChunk (_stream_readable.js:272:9)    
at Socket.Readable.push (_stream_readable.js:213:10)    
at TCP.onStreamRead (internal/stream_base_commons.js:188:23)
```

So you may want to `try/catch` it in your code to prevent the error to propagate.

### db.row()

`db.row()` accepts a resultset from ``db.sql()` and returns only the first row of the results. So instead of returning an array of objects it returns an object or `null` if no data was returned from the database. This function is used when the query sould return only one row or no rows at all, like when querying a table by ID.

### db.value()

Similar to `db.row()` but this function returns only the value returned from the query. So instead of returning an object it returns the value or `null` if no data was returned from the database. This function is used when only one value is needed from the database like when queriying something like `select count(*) from table`. For this particular example you may want to use `db.count()` though.

### db.sequence()

This function returns the nex value on the [sequence](https://www.postgresql.org/docs/12/sql-createsequence.html) created by runnung `npm run schema`

### db.select()

This function is a helper to create a `select` statement by passing arguments instead of using SQL text. For example to select from table *users*:

```typescript
const user_data = await db.select({
    table: "fintech_clients",
    where: {
        "lower(email)": email.toLowerCase()
    }
});
```

As with `db.sql()` this function has the single-row and single-value versions, `db.selectr()` and `db.selectv()` respectively.

### db.insert()

Similar to `db.select()` this function provides a way to insert data wihtout providing the SQL text. For example:

```typescript
await db.insert({
    table: "groups_to_users",
    values: {
        id: uuid(),
        group_id,
        user_id,
        created_by: session_user_id,
        created_ts: timestamp()
    }
});
```

### db.update()

Similar interface as `db.insert()` but to update data:

```typescript
const data = await db.update({
    table: "groups",
    values: {
        group_name,
        description
    },
    where: id
});
```

### db.delete()

Example:

```typescript
const data = await db.delete({
    table: "groups",
    where: id
});
```

### db.count()

Creates a count SQL query with the data suplied and returns the results of the query.

Example:

```typescript
const count = await db.count({
    table: test_table,
    where: {
        a: 1003
    }
});
```

Would return:
```
"PostgreSQL 12.6 (Ubuntu 12.6-0ubuntu0.20.04.1) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.3.0-17ubuntu1~20.04) 9.3.0, 64-bit"
```

### db.uuid()

This funcition reuturns a new UUID value. This value is useful to populate columns of type [uuid](https://www.postgresql.org/docs/12/datatype-uuid.html)

For example this call:
```typescript
const uuid = db.uuid();
```

Would return:
```
"c9126c43-512f-4605-bb8d-fecf0264c6bb"
```