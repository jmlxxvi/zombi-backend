<h1 align="center">
  <a href="https://github.com/jmlxxvi">
    <img src="https://jmlxxvi.github.io/images/icons/geek_zombie256.png">
  </a>
</h1>

# Zombi JSON-RPC Server: Simplicity is the ultimate sophistication.

## Table of Contents

- [Intro](#Intro)
- [Concepts](#Concepts)
- [Installation](#Installation)

## Intro

Zombi is an RPC application server and framework with expressive, elegant syntax and tools.

We believe development must be an enjoyable, creative experience to be truly fulfilling. Zombi attempts to take the pain out of development by easing common tasks used in the majority of application projects, such as authentication, sessions, database access and caching.

It aims to make the development process a pleasing one for the developer without sacrificing application functionality. Happy developers make the best code. To this end, we've attempted to combine the very best of what we have seen in other web frameworks, including frameworks implemented in other languages, such as Java or PHP.

Zombi is accessible, yet powerful, providing powerful tools needed for large, robust applications.

A superb technology stack, expressive APIs, and tightly integrated unit testing support give you the tools you need to build any application with which you are tasked.

We use it very day, it's a very useful tool and we strongly endorse it for net growing.

## Concepts

Zombi is an RPC server. More precisely a JSON-RPC server.

That means you send an JSON string (via HTTPs) and the server responds kindly with another JSON string document.

Being an RPC server also means that the abstraction created to communicate with the server is a _function_. In other words the programmer thinks the communication with the backend in terms of what functions he needs to execute instead of which route, verb or parameters is needed, like in REST. In fact the programmer is being abstracted from the fact that there is a server at all and just execute functions as if they were local to the frontend application.

### How does it work?

Let's see what would be executed in a web frontend application using Zombi:

```javascript
const response = await ZOMBI.server([
  "system/public",
  "login",
  {
    username,
    password,
  },
]);
```

Here the function `ZOMBI.server()` is receiving 3 parameters (yes, is just one parameter, an array, I know, just follow me).
These three parts are:

- The module where the remote function resides, `system/public` in this case.
- The name of the function, `login`
- Some arguments, here represented by the array with two keys of the example.

The resulting JSON that the function `ZOMBI.server()` uses to send to the server would be (following the same example as above):

```json
{
  "mod": "system/public",
  "fun": "login",
  "args": { "username": "johnny", "password": "Br@v0" }
}
```

In pseudo code the function executed on the backend could be represented as:

```javascript
system/public:login({username, password})
```

We are using this nomenclature again.
The general form to represent an RPC function is:

```javascript
<module_path>:<function_name>(<function_arguments>)
```

So, what `ZOMBI.server()` does is:

- Receives 3 values representing a module, a function and the arguments to that function.
- Serializes that information to JSON.
- Sends the JSON data to the server for execution.
- Receives the JSON data with the response of the function.
- Deserializes the data and returns it to the caller as a JS object.

> The fact that the function is executed on a remote machine is not relevant, just what the function needs as arguments and its returned data is what matters.

### Meanwhile, what happens on the server?

Following the example above on the server there is a function that computes what is sent from the frontend.

An example of such a function would be:

```javascript
const login = async (
  args: ZombiAPILoginArguments,
  context: ZombiExecuteContextData
): Promise<ZombiExecuteReturnData<any>> => {

  const { username, password } = args;

  <...some logic>

  return {
      error: true,
      code: 1004,
      message: "Unable to login",
      data: null
  };
};
```

The 3 most important parts of the above function are:

- The function name, `login` in this case.
- The parameter `args` received by the function
- The object literal returned from the function.

If we remember what was sent by the client:

```json
{
  "mod": "system/public",
  "fun": "login",
  "args": { "username": "johnny", "password": "Br@v0" }
}
```

We can see that there is a relation on what is sent with the function executed on the server.

The name of the function executed on the server is the same sent as the key `fun` from the JSON sent by the client.
The location of the server function would be `api/system/public`.
The `args` paramter on ser server function will receive the same data send on the `args` key on the client JSON.

That being said it is clear that the client specifies which function is executed on the server, where is that function located and what parameters are passed to the function.

All the above makes this framerok on an RCP server.

## Installation

### Requirements

- [Node v14+](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)

If you are not using Docker and want to install Redis and PostgreSQL, see `source/platform/cache/README.md` and `source/platform/db/README.md` respectively.

### Node.js

To install Node 14 on Ubuntu 20.04 use the following instructions:

```bash
curl -sL https://deb.nodesource.com/setup_14.x -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs
node -v
```

You should see something like:

```bash
v14.2.0
```

Your minor number may be different.

### Code

Clone the repository:

```bash
git clone https://gitlab.com/telecom-argentina/coo/fintech/api-lambda/la-monolambda.git
```

Install dependencies:

```bash
npm run inst
```

### Environment

Important: you must create a directory **.env** and add a file name **local** to it and set proper environment variables.

```bash
mkdir .env
touch .env/local
```

> Despite the fact that any file would work as a source for environment variables the directory and file name needs to be exactly `.env/local` because some NPM scripts assume the enviroment variables are defined there.

Then edit the file `.env/local` adding the following variables:

```bash
# Database
export ZOMBI_DB_USER=my_db_user
export ZOMBI_DB_HOST=my_db_host
export ZOMBI_DB_PORT=my_db_port
export ZOMBI_DB_PASS=my_db_pass
export ZOMBI_DB_NAME=my_db_name
export ZOMBI_DB_TYPE=postgresql

export ZOMBI_DB_SCHEMA_LOCKED=false

# Cache
export ZOMBI_CACHE_HOST=my_cache_host
export ZOMBI_CACHE_PORT=my_cache_port
export ZOMBI_CACHE_PASS=none
export ZOMBI_CACHE_TLS=false

# Miscellaneous
export NODE_ENV=local
export ZOMBI_SERVER_TIMEOUT=300000
export ZOMBI_LAMBDA_NAME=my_lambda_name

# Client
export ZOMBI_CLIENT_ENDPOINT='http://localhost:8000/server'

# Stats
export ZOMBI_STATS_ENABLED=true

# Logging
export ZOMBI_LOG_LEVEL=DEBUG
export ZOMBI_LOG_PERSIST=true

# Security
export ZOMBI_HIDE_SERVER_ERRORS=false
export ZOMBI_AUTH_HEADER_KEY=my_header_key
export ZOMBI_AUTH_HEADER_VALUE=my_header_value
export ZOMBI_AUTH_REACTOR_TOKEN=my_reactor_token
export ZOMBI_TEST_USER_NAME=my_test_user_name
export ZOMBI_TEST_USER_PASSWORD=my_test_password
export ZOMBI_LOG_ARGUMENTS=true
```

You should replace all varibles starting with `my_` with the proper values for you environment.

If you are setting up a local devlopment environment use the file `infra/localcontainer/env.example` for example:

```bash
cp infra/localcontainer/env.example .env/local
```

Once the file is edited with the appropiate variables or copied from the example file, set the environment:

```bash
. .env/local
```

If you are setting up the local environment you may use Docker and start the database and cache easily with:

```bash
npm run infra:dev
```

The above command will start a container with PostgreSQL and Redis running on the default ports.

After the database and cache services are running, start the server in another terminal with:

```bash
npm run gateway
```

This will start an Express application ready to receive requests.

To check it is working send an HTTP request like the following:

```bash
curl --location --request POST 'http://localhost:8000/server' \
--header 'Content-Type: application/json' \
--data-raw '{
	"mod": "system/public",
	"fun": "version"
}'
```

And you would receive something like:

```json
{
  "error": false,
  "code": 200,
  "message": "ok",
  "data": "2021-03-16 13:13:42",
  "elapsed": 278,
  "request_id": "c9bb518a-1848-49ac-b7ae-1b025be213e6"
}
```

# Datadog integration

https://docs.datadoghq.com/serverless/installation/nodejs/?tab=custom
https://docs.datadoghq.com/serverless/libraries_integrations/extension/

arn:aws:lambda:us-west-2:464622532012:layer:Datadog-Node14-x:67
arn:aws:lambda:us-west-2:464622532012:layer:Datadog-Extension:17

handler /opt/nodejs/node_modules/datadog-lambda-js/handler.handler
DD_LAMBDA_HANDLER lambda.server
DD_TRACE_ENABLED true
DD_API_KEY 6cebc8423e82c2abaf2a94fc69eb6dcd
DD_ENV development
DD_SERVICE zombi
DD_VERSION 12
DD_TAGS type:api,team:platform

FROM node:14 as base

WORKDIR /home/node/app

COPY package\*.json ./

RUN npm i

COPY . .

FROM base as production

ENV NODE_PATH=./build

RUN npm run build
