Zombi Cache Abstraction

## Table of Contents

- [Intro](#Intro)
- [Installation](#Installation)
- [Usage](#Usage)

## Intro

To connect and use cache services Zombi provides abstractions via functions to connect, query and disconnect from those services.

## General information about redis

### Data type available:

- Key: the name of the property
- String: a typical string value
- List: a list of ordered strings (example: 2,12,56,45)
- Hashes: similar to objects, with an object key, then field-value-pairs
- Set: a list of unordered and unique strings
- Sorted set: a list of user-defined ordered unique strings

### Redis persistence explained:

Two options available:

- RDB
- AOF

- AOF uses logs to rebuild the dataset. When the memory exceed the size, it uses the older version and not the updated.
- RDB is like taking snapshots.
- RDB is the default.

## Install Redis locally

Go to this file and follow the installation steps:
https://redis.io/download

You have different client implementations depending on the client you choose.

### Redis with brew

You could install Redis into Mac OS with brew:

```bash
brew install redis
```

To check it is running:

```bash
redis-cli ping
```

## Usage

To use the cache package you need to import the file source/core/cache/index.ts

## Functions

The most common functions are:

### cache.connect():

Connects to the Redis server defined in configuration
Check source/platform/config
@param {string} request_id - The transaction request ID
@returns Promise{void|string} - On error returs the error message

Example:

```typescript
await cache.connect("test");
```

### cache.disconnect():

Disconnects from Redis

Example:

```typescript
await cache.disconnect();
```

### cache.get():

Gets the value of a Redis key
@param {string} key - The Redis key to get
@return Promise{Object} of the parsed JSON value or null

Example:

```typescript
const response = await cache.get("cache_key");
```

### cache.set():

Sets the value of a Redis key
@param {string} key - The Redis key to set
@param {string} value - The Redis value to set
@param {number} ttl - The (optional) time to live of the entry. 0 disables the TTL

Example:

```typescript
await cache.set("cache_key", "123456789");
```

Other functions:

### cache.generic():

Executes the redis function passed as the first parameter of the array
The remaining array elements are passes as arguments to the Redis function
@param args - The generic arguments to call redis functions

Example:

```typescript
const is_authorized = await cache.generic(
  "SISMEMBER",
  `${config.security.cache_key}:${module}`,
  user_id
);
```

### cache.keys():

Returns the keys that match with the beggining of the argument of this function
@param key - The (partial) key of the Redis keys namespace
@returns The Redis keys matching the (partial) key

Example:

```typescript
const keys = await cache.keys(cache_prefix());
```

### cache.del():

Deletes a Redis key
@param key - The Redis key to delete

Example:

```typescript
const cache_prefix_data = `${config.stats.cache_prefix}_DATA`;

await cache.del(cache_prefix_data);
```

### cache.exists():

Checks if the given Redis key exists
@param key - The Redis key to delete
@return Promise(true) is the key exists

Example:

```typescript
const cache_exists = await cache.exists(
  `${config.security.cache_key}S_STARTED`
);
```

### cache.is_connected():

Returns true if the server is connected

Example:

```typescript
cache.is_connected();
```

### cache.fun():

Executed the funtion passed as parameter and saves the results on the Redis key given
It is used as a caching mechanism for functions
@param key - The Redis key to save the results of the function
@param fn - The function to execute
@param ttl - The TTL of the created key
@return The cached value or the function return value

Example:

```typescript
const data = await cache.fun(
  "cached_function_test",
  async () => {
    await sleep(3000);

    return 999;
  },
  10
);
```

## Common errors

Error 1001 not authorized

Solution:

```bash
redis-cli
127.0.0.1:6379> del "ZOMBI_AUTH_MODULES_STARTED"
```

docker run --name zombi-redis -p 6379:6379 -d redis redis-server --save 60 1 --loglevel warning
