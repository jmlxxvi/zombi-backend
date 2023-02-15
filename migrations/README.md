# Database Migrations Project

## Source
https://github.com/amacneil/dbmate

## Get Binary
curl -fsSL -o ./bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64
chmod +x ./bin/dbmate

## Environment File
Example migrations file *.env*

```
export DATABASE_URL=postgresql://postgres:postgres@localhost:15432/postgres?sslmode=disable
export DBMATE_MIGRATIONS_DIR=db/migrations
export DBMATE_MIGRATIONS_TABLE=schema_migrations
export DBMATE_SCHEMA_FILE=db_schema.sql
export DBMATE_NO_DUMP_SCHEMA=false
export DBMATE_WAIT=true
export DBMATE_WAIT_TIMEOUT=10s
```

## Usage

To create new migration files run:

```
./migrations.sh new my_migration_file
```

To apply migrations run:

```
./migrations.sh migrate
```